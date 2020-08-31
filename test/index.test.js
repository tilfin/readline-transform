const assert = require("assert");
const { PassThrough } = require("stream");
const ReadlineTransform = require("../");
const MemoryWriteStream = require("./memory_write_stream");

// let describe = (str, cb) => console.log(str) && cb();
// let it = (str, cb) => console.log(str) && cb();

describe("ReadlineTransform", () => {
  it("should work", () => {
    const { Transform, Stream } = require("stream");
    let t = new Stream.PassThrough();
    const g = new ReadlineTransform();
    const quote = Buffer.from('"');

    const inputFormatter = new Transform({
      transform: (buf, enc, cb) => {
        cb(
          null,
          Buffer.from('\ninput: "' + buf.toString().replace("\n", "\\n") + '"')
        );
      },
    });
    const outputFormatter = new Transform({
      transform: (buf, enc, cb) => {
        cb(
          null,
          Buffer.from('\nOutput: "' + buf.toString().replace("\n", "\\n") + '"')
        );
      },
    });

    t.pipe(inputFormatter).pipe(process.stdout);
    t.pipe(g).pipe(outputFormatter).pipe(process.stdout);
    t.write("line1 hello!\n");
    console.log("buf:" + g._buf);
    t.write("line2 \n line3 yadayada");
    console.log("buf:" + g._buf);

    t.write("yada \n line4");
    console.log("buf:" + g._buf);
    console.log("flushing");
    g._flush(console.log);
  });
});
