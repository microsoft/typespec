// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import type * as http from "node:http";

export interface HttpPart {
  headers: { [k: string]: string | undefined };
  body: ReadableStream<Buffer>;
}

/**
 * Consumes a stream of incoming data and splits it into individual streams for each part of a multipart request, using
 * the provided `boundary` value.
 */
function MultipartBoundaryTransformStream(
  boundary: string,
): ReadableWritablePair<ReadableStream<Buffer>, Buffer> {
  let buffer: Buffer = Buffer.alloc(0);
  // Initialize subcontroller to an object that does nothing. Multipart bodies may contain a preamble before the first
  // boundary, so this dummy controller will discard it.
  let subController: { enqueue(chunk: Buffer): void; close(): void } | null = {
    enqueue() {},
    close() {},
  };

  let boundarySplit = Buffer.from(`--${boundary}`);
  let initialized = false;

  // We need to keep at least the length of the boundary split plus room for CRLFCRLF in the buffer to detect the boundaries.
  // We subtract one from this length because if the whole thing were in the buffer, we would detect it and move past it.
  const bufferKeepLength = boundarySplit.length + BUF_CRLFCRLF.length - 1;
  let _readableController: ReadableStreamDefaultController<ReadableStream<Buffer>> = null as any;

  const readable = new ReadableStream<ReadableStream<Buffer>>({
    start(controller) {
      _readableController = controller;
    },
  });

  const readableController = _readableController;

  const writable = new WritableStream<Buffer>({
    write: async (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);

      let index: number;

      while ((index = buffer.indexOf(boundarySplit)) !== -1) {
        // We found a boundary, emit everything before it and initialize a new stream for the next part.

        // We are initialized if we have found the boundary at least once.
        //
        // Cases
        // 1. If the index is zero and we aren't initialized, there was no preamble.
        // 2. If the index is zero and we are initialized, then we had to have found \r\n--boundary, nothing special to do.
        // 3. If the index is not zero, and we are initialized, then we found \r\n--boundary somewhere in the middle,
        //    nothing special to do.
        // 4. If the index is not zero and we aren't initialized, then we need to check that boundarySplit was preceded
        //    by \r\n for validity, because the preamble must end with \r\n.

        if (index > 0) {
          if (!initialized) {
            if (!buffer.subarray(index - 2, index).equals(Buffer.from("\r\n"))) {
              readableController.error(new Error("Invalid preamble in multipart body."));
            } else {
              await enqueueSub(buffer.subarray(0, index - 2));
            }
          } else {
            await enqueueSub(buffer.subarray(0, index));
          }
        }

        // We enqueued everything before the boundary, so we clear the buffer past the boundary
        buffer = buffer.subarray(index + boundarySplit.length);

        // We're done with the current part, so close the stream. If this is the opening boundary, there won't be a
        // subcontroller yet.
        subController?.close();
        subController = null;

        if (!initialized) {
          initialized = true;
          boundarySplit = Buffer.from(`\r\n${boundarySplit}`);
        }
      }

      if (buffer.length > bufferKeepLength) {
        await enqueueSub(buffer.subarray(0, -bufferKeepLength));
        buffer = buffer.subarray(-bufferKeepLength);
      }
    },
    close() {
      if (!/--(\r\n)?/.test(buffer.toString("utf-8"))) {
        readableController.error(new Error("Unexpected characters after final boundary."));
      }

      subController?.close();

      readableController.close();
    },
  });

  async function enqueueSub(s: Buffer) {
    subController ??= await new Promise<ReadableStreamDefaultController>((resolve) => {
      readableController.enqueue(
        new ReadableStream<Buffer>({
          start: (controller) => resolve(controller),
        }),
      );
    });

    subController.enqueue(s);
  }

  return { readable, writable };
}

const BUF_CRLFCRLF = Buffer.from("\r\n\r\n");

/**
 * Consumes a stream of the contents of a single part of a multipart request and emits an `HttpPart` object for each part.
 * This consumes just enough of the stream to read the headers, and then forwards the rest of the stream as the body.
 */
class HttpPartTransform extends TransformStream<ReadableStream<Buffer>, HttpPart> {
  constructor() {
    super({
      transform: async (partRaw, controller) => {
        const reader = partRaw.getReader();

        let buf = Buffer.alloc(0);
        let idx;

        while ((idx = buf.indexOf(BUF_CRLFCRLF)) === -1) {
          const { done, value } = await reader.read();
          if (done) {
            throw new Error("Unexpected end of part.");
          }
          buf = Buffer.concat([buf, value]);
        }

        const headerText = buf.subarray(0, idx).toString("utf-8").trim();

        const headers = Object.fromEntries(
          headerText.split("\r\n").map((line) => {
            const [name, value] = line.split(": ", 2);

            return [name.toLowerCase(), value];
          }),
        ) as { [k: string]: string };

        const body = new ReadableStream<Buffer>({
          start(controller) {
            controller.enqueue(buf.subarray(idx + BUF_CRLFCRLF.length));
          },
          async pull(controller) {
            const { done, value } = await reader.read();

            if (done) {
              controller.close();
            } else {
              controller.enqueue(value);
            }
          },
        });

        controller.enqueue({ headers, body });
      },
    });
  }
}

/**
 * Processes a request as a multipart request, returning a stream of `HttpPart` objects, each representing an individual
 * part in the multipart request.
 *
 * Only call this function if you have already validated the content type of the request and confirmed that it is a
 * multipart request.
 *
 * @throws Error if the content-type header is missing or does not contain a boundary field.
 *
 * @param request - the incoming request to parse as multipart
 * @returns a stream of HttpPart objects, each representing an individual part in the multipart request
 */
export function createMultipartReadable(request: http.IncomingMessage): ReadableStream<HttpPart> {
  const boundary = request.headers["content-type"]
    ?.split(";")
    .find((s) => s.includes("boundary="))
    ?.split("=", 2)[1];
  if (!boundary) {
    throw new Error("Invalid request: missing boundary in content-type.");
  }

  const bodyStream = new ReadableStream<Uint8Array>({
    start(controller) {
      request.on("data", (chunk: Buffer) => {
        controller.enqueue(chunk);
      });
      request.on("end", () => controller.close());
    },
  });

  return bodyStream
    .pipeThrough(MultipartBoundaryTransformStream(boundary))
    .pipeThrough(new HttpPartTransform());
}

// Gross polyfill because Safari doesn't support this yet.
//
// https://bugs.webkit.org/show_bug.cgi?id=194379
// https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream#browser_compatibility
(ReadableStream.prototype as any)[Symbol.asyncIterator] ??= async function* () {
  const reader = this.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return value;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
};

declare global {
  interface ReadableStream<R> {
    [Symbol.asyncIterator](): AsyncIterableIterator<R>;
  }
}
