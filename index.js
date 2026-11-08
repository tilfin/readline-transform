const { Transform } = require('stream');
const { StringDecoder } = require('string_decoder');

/**
 * The ReadlineTransform is reading String or Buffer content from a Readable stream
 * and writing each line which ends without line break as object
 *
 * @param {RegExp} opts.breakMatcher - line break matcher for str.split() (default: /\r?\n/)
 * @param {Boolean} opts.ignoreEndOfBreak - if content ends with line break, ignore last empty line (default: true)
 * @param {Boolean} opts.skipEmpty - if line is empty string, skip it (default: false)
 */
class ReadlineTransform extends Transform {
  #brRe;
  #ignoreEndOfBreak;
  #skipEmpty;
  #buf;
  #decoder;

  constructor(options = {}) {
    const { breakMatcher = /\r?\n/, ignoreEndOfBreak = true, skipEmpty = false, ...opts } = options;
    super({ ...opts, objectMode: true });
    this.#brRe = breakMatcher;
    this.#ignoreEndOfBreak = ignoreEndOfBreak;
    this.#skipEmpty = skipEmpty;
    this.#buf = null;
    this.#decoder = new StringDecoder('utf8');
  }

  _transform(chunk, encoding, cb) {
    let str;
    if (Buffer.isBuffer(chunk) || encoding === 'buffer') {
      // StringDecoder keeps incomplete multi-byte sequences until the next chunk
      str = this.#decoder.write(chunk);
    } else {
      // flush bytes left by a preceding Buffer chunk before a string chunk
      const rest = this.#decoder.end();
      str = rest ? rest + chunk : chunk;
    }

    try {
      if (this.#buf !== null) {
        this.#buf += str;  
      } else {
        this.#buf = str;  
      }

      const lines = this.#buf.split(this.#brRe);
      const lastIndex = lines.length - 1;
      for (let i = 0; i < lastIndex; i++) {
        this._writeItem(lines[i]);
      }

      const lastLine = lines[lastIndex];
      if (lastLine.length) {
        this.#buf = lastLine;
      } else if (!this.#ignoreEndOfBreak) {
        this.#buf = '';
      } else {
        this.#buf = null;
      }
      cb();
    } catch(err) {
      cb(err); // invalid data type;
    }
  }

  _flush(cb) {
    const rest = this.#decoder.end();
    if (rest) {
      this.#buf = (this.#buf ?? '') + rest;
    }
    if (this.#buf !== null) {
      this._writeItem(this.#buf);
      this.#buf = null;
    }
    cb();
  }

  _writeItem(line) {
    if (line.length > 0 || !this.#skipEmpty) {
      this.push(line);
    }
  }
}

module.exports = exports.default = ReadlineTransform;
module.exports.ReadlineTransform = ReadlineTransform;
