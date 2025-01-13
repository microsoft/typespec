import { EventEmitter } from "stream";
import { assert, describe, it } from "vitest";
import { createMultipartReadable } from "../src/helpers/multipart.js";

import type * as http from "node:http";

interface StringChunkOptions {
  sizeConstraint: [number, number];
  timeConstraintMs: [number, number];
}

function chunkString(s: string, options: StringChunkOptions): EventEmitter {
  const [min, max] = options.sizeConstraint;
  const [minTime, maxTime] = options.timeConstraintMs;
  const emitter = new EventEmitter();
  let i = 0;

  function emitChunk() {
    const chunkSize = Math.floor(Math.random() * (max - min + 1) + min);
    emitter.emit("data", Buffer.from(s.slice(i, i + chunkSize)));
    i += chunkSize;
  }

  setTimeout(
    function tick() {
      emitChunk();

      if (i < s.length) {
        setTimeout(tick, Math.floor(Math.random() * (maxTime - minTime + 1) + minTime));
      } else {
        emitter.emit("end");
      }
    },
    Math.floor(Math.random() * (maxTime - minTime + 1) + minTime),
  );

  return emitter;
}

const exampleMultipart = [
  "This is the preamble text. It should be ignored.",
  "--boundary",
  'Content-Disposition: form-data; name="field1"',
  "Content-Type: application/json",
  "",
  '"value1"',
  "--boundary",
  'Content-Disposition: form-data; name="field2"',
  "",
  "value2",
  "--boundary--",
].join("\r\n");

function createMultipartRequestLike(
  text: string,
  boundary: string = "boundary",
): http.IncomingMessage {
  return Object.assign(
    chunkString(text, { sizeConstraint: [40, 90], timeConstraintMs: [20, 30] }),
    {
      headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
    },
  ) as any;
}

describe("multipart", () => {
  it("correctly chunks multipart data", async () => {
    const request = createMultipartRequestLike(exampleMultipart);

    const stream = createMultipartReadable(request);

    const parts: Array<{ headers: { [k: string]: string | undefined }; body: string }> = [];

    for await (const part of stream) {
      parts.push({
        headers: part.headers,
        body: await (async () => {
          const chunks = [];
          for await (const chunk of part.body) {
            chunks.push(chunk);
          }
          return Buffer.concat(chunks).toString();
        })(),
      });
    }

    assert.deepStrictEqual(parts, [
      {
        headers: {
          "content-disposition": 'form-data; name="field1"',
          "content-type": "application/json",
        },
        body: '"value1"',
      },
      {
        headers: { "content-disposition": 'form-data; name="field2"' },
        body: "value2",
      },
    ]);
  });

  it("detects missing boundary", () => {
    assert.throws(() => {
      createMultipartReadable({ headers: {} } as any);
    }, "missing boundary");

    assert.throws(() => {
      createMultipartReadable({
        headers: { "content-type": "multipart/form-data" },
      } as any);
    }, "missing boundary");
  });

  it("detects unexpected termination", async () => {
    const request = createMultipartRequestLike(
      [
        "--boundary",
        'Content-Disposition: form-data; name="field1"',
        "Content-Type: application/json",
        "",
        '"value1"',
        "--boundary asdf asdf",
      ].join("\r\n"),
    );

    const stream = createMultipartReadable(request);

    try {
      for await (const part of stream) {
        for await (const _ of part.body) {
          // Do nothing
        }
      }
      assert.fail();
    } catch (e) {
      assert.equal((e as Error).message, "Unexpected characters after final boundary.");
    }
  });

  it("detects invalid preamble text", async () => {
    const request = createMultipartRequestLike(
      [
        "This is the preamble text. It should be ignored.--boundary",
        'Content-Disposition: form-data; name="field1"',
        "Content-Type: application/json",
        "",
        '"value1"',
        "--boundary",
        'Content-Disposition: form-data; name="field2"',
        "",
        "value2",
        "--boundary--",
      ].join("\r\n"),
    );

    const stream = createMultipartReadable(request);

    try {
      for await (const part of stream) {
        for await (const _ of part.body) {
          // Do nothing
        }
      }
      assert.fail();
    } catch (e) {
      assert.equal((e as Error).message, "Invalid preamble in multipart body.");
    }
  });
});
