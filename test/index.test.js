const assert = require('assert');
const { PassThrough } = require('stream');
const ReadlineTransform = require('../');
const MemoryWriteStream = require('./memory_write_stream');

describe('ReadlineTransform', () => {

  context('data ends without line break', () => {
    it('transforms all lines', (done) => {
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

    context('data contains empty lines and skipEmpty option is true', () => {
      it('transforms with dropping empty lines', (done) => {
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

  context('data ends with line break', () => {
    it('transforms all lines except last empty line', (done) => {
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

    context('ignoreEndOfBreak is false', () => {
      it('transforms all lines', (done) => {
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

    context('skipEmpty option is true', () => {
      it('transforms with dropping empty lines', (done) => {
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

    context('ignoreEndOfBreak is false and skipEmpty option is true', () => {
      it('works with dropping all empty lines', (done) => {
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

  context('line break is special', () => {
    it('transforms with dropping last empty line', (done) => {
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
