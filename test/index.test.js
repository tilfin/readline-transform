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

  describe('input is string chunks', () => {
    test('transforms string-only chunks', (t, done) => {
      const readStream = new PassThrough();
      readStream.setEncoding('utf8');
      const transform = new ReadlineTransform();
      const writeStream = new MemoryWriteStream();

      writeStream.on('finish', () => {
        assert.deepStrictEqual(writeStream.data, ['foo', 'bar', 'あいう', 'baz']);
        done();
      });

      readStream.pipe(transform).pipe(writeStream);

      readStream.write('foo\nba');
      readStream.write('r\r');
      readStream.write('\nあい');
      readStream.end('う\nbaz\n');
    });

    test('transforms mixed Buffer and string chunks', (t, done) => {
      const readStream = new PassThrough({ objectMode: true });
      const transform = new ReadlineTransform();
      const writeStream = new MemoryWriteStream();

      writeStream.on('finish', () => {
        assert.deepStrictEqual(writeStream.data, ['foo', 'bar', 'あいう', 'baz']);
        done();
      });

      readStream.pipe(transform).pipe(writeStream);

      readStream.write(Buffer.from('foo\nba'));
      readStream.write('r\r');
      readStream.write(Buffer.from('\nあい'));
      readStream.write('う\nba');
      readStream.end(Buffer.from('z'));
    });
  })

  describe('multi-byte characters are split across Buffer chunks', () => {
    test('decodes 2-byte characters correctly', (t, done) => {
      const readStream = new PassThrough();
      const transform = new ReadlineTransform();
      const writeStream = new MemoryWriteStream();

      writeStream.on('finish', () => {
        assert.deepStrictEqual(writeStream.data, ['héllo', 'wörld']);
        done();
      });

      readStream.pipe(transform).pipe(writeStream);

      const input = Buffer.from('héllo\nwörld\n');
      // 'é' is 0xC3 0xA9; split between those bytes
      readStream.write(input.subarray(0, 2));
      readStream.end(input.subarray(2));
    });

    test('decodes 3-byte and 4-byte characters split at every byte', (t, done) => {
      const readStream = new PassThrough();
      const transform = new ReadlineTransform();
      const writeStream = new MemoryWriteStream();

      writeStream.on('finish', () => {
        assert.deepStrictEqual(writeStream.data, ['あいう', '😀𠮷', 'かき']);
        done();
      });

      readStream.pipe(transform).pipe(writeStream);

      const input = Buffer.from('あいう\n😀𠮷\r\nかき');
      for (let i = 0; i < input.length; i++) {
        readStream.write(input.subarray(i, i + 1));
      }
      readStream.end();
    });

    test('flushes incomplete bytes before a following string chunk', (t, done) => {
      const transform = new ReadlineTransform();
      const writeStream = new MemoryWriteStream();

      writeStream.on('finish', () => {
        assert.deepStrictEqual(writeStream.data, ['foo�', 'bar']);
        done();
      });

      transform.pipe(writeStream);

      // write directly so that the string chunk is not converted to Buffer by PassThrough
      transform.write(Buffer.from([0x66, 0x6f, 0x6f, 0xe3, 0x81])); // 'foo' + first 2 bytes of 'あ'
      transform.write('\nbar');
      transform.end();
    });

    test('emits replacement character for incomplete bytes at the end', (t, done) => {
      const readStream = new PassThrough();
      const transform = new ReadlineTransform();
      const writeStream = new MemoryWriteStream();

      writeStream.on('finish', () => {
        assert.deepStrictEqual(writeStream.data, ['foo', 'bar�']);
        done();
      });

      readStream.pipe(transform).pipe(writeStream);

      readStream.write(Buffer.from('foo\nbar'));
      readStream.end(Buffer.from([0xe3, 0x81])); // first 2 bytes of 'あ'
    });
  })

})
