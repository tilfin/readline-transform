# ReadlineTransform

[![npm](https://img.shields.io/npm/v/readline-transform.svg)](https://www.npmjs.com/package/readline-transform)
[![Node](https://img.shields.io/node/v/readline-transform.svg)]()
[![License](https://img.shields.io/github/license/tilfin/readline-transform.svg)]()

Reading String or Buffer content from a Readable stream and writing each line which ends without line break as object

## Install

```
$ npm install -save readline-transform
```

## How to Use

### Create a ReadlineTransform

**new ReadlineTransform(options)**

* `options` `<Object>`
  * `breakMatcher` is the regular expression to split content by line break for `str.split()`. (default: `/\r?\n/`)
  * `ignoreEndOfBreak` is boolean. if content ends with line break, ignore last empty line. (default: `true`)
  * `skipEmpty` is boolean. if line is empty string, skip it (default: `false`)

## Examples

### CommonJS 

```javascript
const { PassThrough } = require('stream');
const { ReadlineTransform } = require('readline-transform');

const readStream = new PassThrough();
const transform = new ReadlineTransform({ skipEmpty: true });
const writeStream = new PassThrough({ objectMode: true });

writeStream.on('data', (line) => {
  console.log(line);
}).on('finish', () => {
  console.log('<<< all done >>>');
});

readStream.pipe(transform).pipe(writeStream);

readStream.write(Buffer.from('foo\nba'));
readStream.write(Buffer.from('r\r\n\n\r'));
readStream.end(Buffer.from('\nbaz'));
```

### ES Module 

```javascript
import fs from 'node:fs';
import { PassThrough } from 'node:stream'; 
import { ReadlineTransform } from 'readline-transform';

const readStream = new PassThrough();
const transform = new ReadlineTransform({ skipEmpty: true });
const writeStream = new PassThrough({ objectMode: true });

writeStream.on('data', (line) => {
  console.log(line);
}).on('finish', () => {
  console.log('<<< all done >>>');
});

readStream.pipe(transform).pipe(writeStream);

readStream.write(Buffer.from('foo\nba'));
readStream.write(Buffer.from('r\r\n\n\r'));
readStream.end(Buffer.from('\nbaz'));
```

### Console output

```
$ node example.js
foo
bar
baz
<<< all done >>>
```
