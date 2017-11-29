'use strict';

const stream = require('stream');

class MemoryWriteStream extends stream.Writable {
  constructor() {
    super({ objectMode: true });
    this._results = [];
  }

  get data() {
    return this._results;
  }

  _write(data, _, cb) {
    this._results.push(data);
    cb();
  }
}

module.exports = MemoryWriteStream;
