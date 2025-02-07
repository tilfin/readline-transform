import assert from 'assert';
import { PassThrough } from 'stream';
import { ReadlineTransform } from '../index.mjs';
import MemoryWriteStream from './memory_write_stream.js';

describe('ReadlineTransform by ES module', () => {
  it('succeeds', (done) => {
    const readStream = new PassThrough();
    const transform = new ReadlineTransform();
    const writeStream = new MemoryWriteStream();

    writeStream.on('finish', () => {
      assert.deepStrictEqual(writeStream.data, ['foo', 'bar', 'ban']);
      done();
    });

    readStream.pipe(transform).pipe(writeStream);

    readStream.write(Buffer.from('foo\nba'));
    readStream.write('r\r');
    readStream.end(Buffer.from('\nban\n'));
  });
});
