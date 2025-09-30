import { Buffer } from "node:buffer";
import { Readable as ReadableStream, Writable as WritableStream } from "node:stream";

export function mockProcess(path: string): NodeJS.Process {
  return {
    ...process,
    exit: () => {
      throw new Error(`Importing ${path} tried to call process.exit`);
    },
    stdin: readableNoopStream() as any,
    stdout: writableNoopStream() as any,
    on: (() => {}) as any,
  };
}

function readableNoopStream({ size = 0 } = {}) {
  let producedSize = 0;

  return new ReadableStream({
    read(readSize) {
      let shouldEnd = false;

      if (producedSize + readSize >= size) {
        readSize = size - producedSize;
        shouldEnd = true;
      }

      setImmediate(() => {
        if (size === 0) {
          this.push(null);
        }

        producedSize += readSize;
        this.push(Buffer.alloc(readSize));

        if (shouldEnd) {
          this.push(null);
        }
      });
    },
  });
}

function writableNoopStream() {
  return new WritableStream({
    write(chunk, encding, callback) {
      setImmediate(callback);
    },
  });
}
