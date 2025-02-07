import fs from 'node:fs';
import { PassThrough } from 'node:stream'; 
import { ReadlineTransform } from '../index.mjs';
//import ReadlineTransform from '../index.mjs';

const transform = new ReadlineTransform({ skipEmpty: true });
const fileStream = fs.createReadStream('./data.txt');

const writeStream = new PassThrough({ objectMode: true });

const results = [];
writeStream.on('data', (line) => {
  results.push(line);
}).on('finish', () => {
  console.log(results);
});

fileStream
  .pipe(transform)
  .pipe(writeStream);
