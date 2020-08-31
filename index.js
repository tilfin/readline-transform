const { Transform } = require("stream");

/**
 * The ReadlineTransform is reading String or Buffer content from a Readable stream
 * and writing each line which ends without line break as object
 *
 * @param {RegExp} opts.breakMatcher - line break matcher for str.split() (default: /\r?\n/)
 * @param {Boolean} opts.ignoreEndOfBreak - if content ends with line break, ignore last empty line (default: true)
 * @param {Boolean} opts.skipEmpty - if line is empty string, skip it (default: false)
 */
const NEWLINE = 0x0a;
class ReadlineTransform extends Transform {
  constructor() {
    super();
    this._buf = Buffer.alloc(1024);
    this.wptr = 0;
  }

  _transform(chunk, enc, cb) {
    let lb;
    while ((lb = chunk.indexOf(NEWLINE)) >= 0 && chunk.length) {
      this._emitData(chunk.slice(0, lb + 1));
      chunk = chunk.slice(lb + 1);
    }
    if (chunk.length) {
      chunk.copy(this._buf, this.wptr, 0, chunk.length);
      this.wptr += chunk.length;
    }
    cb(null, null);
  }

  _emitData(slice) {
    if (this.wptr) {
      this.emit("data", Buffer.concat([this._buf.slice(0, this.wptr), slice]));
      this.wptr = 0;
    } else {
      this.emit("data", slice);
    }
  }
  _flush(cb) {
    cb(this._buf.slice(0, this.wptr));
  }
}

module.exports = exports.default = ReadlineTransform;
