const { PassThrough } = require('stream');
const { ReadlineTransform } = require('../');
//const ReadlineTransform = require('../');

const readStream = new PassThrough();
const transform = new ReadlineTransform({ skipEmpty: true });
const writeStream = new PassThrough({ objectMode: true });

writeStream.on('data', (line) => {
  console.log(line);
}).on('finish', () => {
  console.log('<<< all done >>>');
});

readStream.pipe(transform).pipe(writeStream);

readStream.write(new Buffer('foo\nba'));
readStream.write(new Buffer('r\r\n\n\r'));
readStream.end(new Buffer('\nbaz'));
