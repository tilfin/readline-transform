const assert = require('assert');
const { describe, test } = require('node:test');
const { PassThrough } = require('stream');
const ReadlineTransform = require('../index.js');
const MemoryWriteStream = require('./memory_write_stream');

describe('ReadlineTransform', () => {

  describe('data ends without line break', () => {
    test('transforms all lines', (t, done) => {
      const readStream = new PassThrough();
      const transform = new ReadlineTransform();
      const writeStream = new MemoryWriteStream();

      writeStream.on('finish', () => {
        assert.deepEqual(writeStream.data, ['foo', 'bar', 'baz']);
        done();
      });

      readStream.pipe(transform).pipe(writeStream);

      readStream.write(Buffer.from('foo\nba'));
      readStream.write('r\r');
      readStream.end(Buffer.from('\nbaz'));
    });

    describe('data contains empty lines and skipEmpty option is true', () => {
      test('transforms with dropping empty lines', (t, done) => {
        const readStream = new PassThrough();
        const transform = new ReadlineTransform({ skipEmpty: true });
        const writeStream = new MemoryWriteStream();

        writeStream.on('finish', () => {
          assert.deepEqual(writeStream.data, ['foo', 'bar', 'baz']);
          done();
        });

        readStream.pipe(transform).pipe(writeStream);

        readStream.write('foo\nba');
        readStream.write(Buffer.from('r\r\n\n\r'));
        readStream.end(Buffer.from('\nbaz'));
      });
    })
  })

  describe('data ends with line break', () => {
    test('transforms all lines except last empty line', (t, done) => {
      const readStream = new PassThrough();
      const transform = new ReadlineTransform();
      const writeStream = new MemoryWriteStream();

      writeStream.on('finish', () => {
        assert.deepEqual(writeStream.data, ['foo', 'bar', '', 'baz']);
        done();
      });

      readStream.pipe(transform).pipe(writeStream);

      readStream.write(Buffer.from('foo\r\nbar\n'));
      readStream.end('\r\nbaz\r\n');
    });

    describe('ignoreEndOfBreak is false', () => {
      test('transforms all lines', (t, done) => {
        const readStream = new PassThrough();
        const transform = new ReadlineTransform({ ignoreEndOfBreak: false });
        const writeStream = new MemoryWriteStream();

        writeStream.on('finish', () => {
          assert.deepEqual(writeStream.data, ['foo', 'bar', '', 'baz', '']);
          done();
        });

        readStream.pipe(transform).pipe(writeStream);

        readStream.write(Buffer.from('foo\r\nbar\n'));
        readStream.end('\r\nbaz\r\n');
      });
    })

    describe('skipEmpty option is true', () => {
      test('transforms with dropping empty lines', (t, done) => {
        const readStream = new PassThrough();
        const transform = new ReadlineTransform({ skipEmpty: true });
        const writeStream = new MemoryWriteStream();

        writeStream.on('finish', () => {
          assert.deepEqual(writeStream.data, ['foo', 'bar', 'baz']);
          done();
        });

        readStream.pipe(transform).pipe(writeStream);

        readStream.write('foo\r\nbar\n');
        readStream.end(Buffer.from('\r\nbaz\r\n'));
      });
    })

    describe('ignoreEndOfBreak is false and skipEmpty option is true', () => {
      test('works with dropping all empty lines', (t, done) => {
        const readStream = new PassThrough();
        const transform = new ReadlineTransform({ ignoreEndOfBreak: false, skipEmpty: true });
        const writeStream = new MemoryWriteStream();

        writeStream.on('finish', () => {
          assert.deepEqual(writeStream.data, ['foo', ' ', 'bar']);
          done();
        });

        readStream.pipe(transform).pipe(writeStream);

        readStream.write(Buffer.from('foo\n \n'));
        readStream.write('\n\n');
        readStream.write(Buffer.from('bar\n'));
        readStream.end();
      });
    })

  })

  describe('line break is special', () => {
    test('transforms with dropping last empty line', (t, done) => {
      const readStream = new PassThrough();
      const transform = new ReadlineTransform({ breakMatcher: '_\n' });
      const writeStream = new MemoryWriteStream();

      writeStream.on('finish', () => {
        assert.deepEqual(writeStream.data, ['', 'foo', 'bar', 'baz', '']);
        done();
      });

      readStream.pipe(transform).pipe(writeStream);

      readStream.write(Buffer.from('_\nfoo_\nbar_\nbaz_\n_\n'));
      readStream.end();
    });
  })

})
