const { Transform } = require('stream');

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

  constructor(options = {}) {
    const { breakMatcher = /\r?\n/, ignoreEndOfBreak = true, skipEmpty = false, ...opts } = options;
    super({ ...opts, objectMode: true });
    this.#brRe = breakMatcher;
    this.#ignoreEndOfBreak = ignoreEndOfBreak;
    this.#skipEmpty = skipEmpty;
    this.#buf = null;
  }

  _transform(chunk, encoding, cb) {
    let str;
    if (Buffer.isBuffer(chunk) || encoding === 'buffer') {
      str = chunk.toString('utf8');
    } else {
      str = chunk;
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
