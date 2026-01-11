/* eslint-disable */
// @ts-nocheck
// ported from:
// https://github.com/tc39/proposal-arraybuffer-base64/blob/2cfac3868ce974fada217b9eb899dc37e8c0ee2c/playground/polyfill-core.mjs#L33

// MIT License

// Copyright (c) 2017 ECMA TC39 and contributors

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

let base64Characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
let base64UrlCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

let tag = Object.getOwnPropertyDescriptor(
  Object.getPrototypeOf(Uint8Array.prototype),
  Symbol.toStringTag,
).get;
export function checkUint8Array(arg) {
  let kind;
  try {
    kind = tag.call(arg);
  } catch {
    throw new TypeError("not a Uint8Array");
  }
  if (kind !== "Uint8Array") {
    throw new TypeError("not a Uint8Array");
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assert failed: ${message}`);
  }
}

function getOptions(options) {
  if (typeof options === "undefined") {
    return Object.create(null);
  }
  if (options && typeof options === "object") {
    return options;
  }
  throw new TypeError("options is not object");
}

export function uint8ArrayToBase64(arr, options) {
  checkUint8Array(arr);
  let opts = getOptions(options);
  let alphabet = opts.alphabet;
  if (typeof alphabet === "undefined") {
    alphabet = "base64";
  }
  if (alphabet !== "base64" && alphabet !== "base64url") {
    throw new TypeError('expected alphabet to be either "base64" or "base64url"');
  }
  let omitPadding = !!opts.omitPadding;

  if ("detached" in arr.buffer && arr.buffer.detached) {
    throw new TypeError("toBase64 called on array backed by detached buffer");
  }

  let lookup = alphabet === "base64" ? base64Characters : base64UrlCharacters;
  let result = "";

  let i = 0;
  for (; i + 2 < arr.length; i += 3) {
    let triplet = (arr[i] << 16) + (arr[i + 1] << 8) + arr[i + 2];
    result +=
      lookup[(triplet >> 18) & 63] +
      lookup[(triplet >> 12) & 63] +
      lookup[(triplet >> 6) & 63] +
      lookup[triplet & 63];
  }
  if (i + 2 === arr.length) {
    let triplet = (arr[i] << 16) + (arr[i + 1] << 8);
    result +=
      lookup[(triplet >> 18) & 63] +
      lookup[(triplet >> 12) & 63] +
      lookup[(triplet >> 6) & 63] +
      (omitPadding ? "" : "=");
  } else if (i + 1 === arr.length) {
    let triplet = arr[i] << 16;
    result +=
      lookup[(triplet >> 18) & 63] + lookup[(triplet >> 12) & 63] + (omitPadding ? "" : "==");
  }
  return result;
}

function decodeBase64Chunk(chunk, throwOnExtraBits) {
  let actualChunkLength = chunk.length;
  if (actualChunkLength < 4) {
    chunk += actualChunkLength === 2 ? "AA" : "A";
  }

  let map = new Map(base64Characters.split("").map((c, i) => [c, i]));

  let c1 = chunk[0];
  let c2 = chunk[1];
  let c3 = chunk[2];
  let c4 = chunk[3];

  let triplet = (map.get(c1) << 18) + (map.get(c2) << 12) + (map.get(c3) << 6) + map.get(c4);

  let chunkBytes = [(triplet >> 16) & 255, (triplet >> 8) & 255, triplet & 255];

  if (actualChunkLength === 2) {
    if (throwOnExtraBits && chunkBytes[1] !== 0) {
      throw new SyntaxError("extra bits");
    }
    return [chunkBytes[0]];
  } else if (actualChunkLength === 3) {
    if (throwOnExtraBits && chunkBytes[2] !== 0) {
      throw new SyntaxError("extra bits");
    }
    return [chunkBytes[0], chunkBytes[1]];
  }
  return chunkBytes;
}

function skipAsciiWhitespace(string, index) {
  for (; index < string.length; ++index) {
    if (!/[\u0009\u000A\u000C\u000D\u0020]/.test(string[index])) {
      break;
    }
  }
  return index;
}

function fromBase64(string, alphabet, lastChunkHandling, maxLength) {
  if (maxLength === 0) {
    return { read: 0, bytes: [], error: null };
  }

  let read = 0;
  let bytes = [];
  let chunk = "";

  let index = 0;
  while (true) {
    index = skipAsciiWhitespace(string, index);
    if (index === string.length) {
      if (chunk.length > 0) {
        if (lastChunkHandling === "stop-before-partial") {
          return { bytes, read, error: null };
        } else if (lastChunkHandling === "loose") {
          if (chunk.length === 1) {
            let error = new SyntaxError("malformed padding: exactly one additional character");
            return { bytes, read, error };
          }
          bytes.push(...decodeBase64Chunk(chunk, false));
        } else {
          assert(lastChunkHandling === "strict");
          let error = new SyntaxError("missing padding");
          return { bytes, read, error };
        }
      }
      return { bytes, read: string.length, error: null };
    }
    let char = string[index];
    ++index;
    if (char === "=") {
      if (chunk.length < 2) {
        let error = new SyntaxError("padding is too early");
        return { bytes, read, error };
      }
      index = skipAsciiWhitespace(string, index);
      if (chunk.length === 2) {
        if (index === string.length) {
          if (lastChunkHandling === "stop-before-partial") {
            // two characters then `=` then EOS: this is, technically, a partial chunk
            return { bytes, read, error: null };
          }
          let error = new SyntaxError("malformed padding - only one =");
          return { bytes, read, error };
        }
        if (string[index] === "=") {
          ++index;
          index = skipAsciiWhitespace(string, index);
        }
      }
      if (index < string.length) {
        let error = new SyntaxError("unexpected character after padding");
        return { bytes, read, error };
      }
      bytes.push(...decodeBase64Chunk(chunk, lastChunkHandling === "strict"));
      assert(bytes.length <= maxLength);
      return { bytes, read: string.length, error: null };
    }
    if (alphabet === "base64url") {
      if (char === "+" || char === "/") {
        let error = new SyntaxError(`unexpected character ${JSON.stringify(char)}`);
        return { bytes, read, error };
      } else if (char === "-") {
        char = "+";
      } else if (char === "_") {
        char = "/";
      }
    }
    if (!base64Characters.includes(char)) {
      let error = new SyntaxError(`unexpected character ${JSON.stringify(char)}`);
      return { bytes, read, error };
    }
    let remainingBytes = maxLength - bytes.length;
    if (
      (remainingBytes === 1 && chunk.length === 2) ||
      (remainingBytes === 2 && chunk.length === 3)
    ) {
      // special case: we can fit exactly the number of bytes currently represented by chunk, so we were just checking for `=`
      return { bytes, read, error: null };
    }

    chunk += char;
    if (chunk.length === 4) {
      bytes.push(...decodeBase64Chunk(chunk, false));
      chunk = "";
      read = index;
      assert(bytes.length <= maxLength);
      if (bytes.length === maxLength) {
        return { bytes, read, error: null };
      }
    }
  }
}

export function base64ToUint8Array(string, options, into) {
  let opts = getOptions(options);
  let alphabet = opts.alphabet;
  if (typeof alphabet === "undefined") {
    alphabet = "base64";
  }
  if (alphabet !== "base64" && alphabet !== "base64url") {
    throw new TypeError('expected alphabet to be either "base64" or "base64url"');
  }
  let lastChunkHandling = opts.lastChunkHandling;
  if (typeof lastChunkHandling === "undefined") {
    lastChunkHandling = "loose";
  }
  if (!["loose", "strict", "stop-before-partial"].includes(lastChunkHandling)) {
    throw new TypeError(
      'expected lastChunkHandling to be either "loose", "strict", or "stop-before-partial"',
    );
  }
  if (into && "detached" in into.buffer && into.buffer.detached) {
    throw new TypeError("toBase64Into called on array backed by detached buffer");
  }

  let maxLength = into ? into.length : 2 ** 53 - 1;

  let { bytes, read, error } = fromBase64(string, alphabet, lastChunkHandling, maxLength);
  if (error && !into) {
    throw error;
  }

  bytes = new Uint8Array(bytes);
  if (into && bytes.length > 0) {
    assert(bytes.length <= into.length);
    into.set(bytes);
  }

  if (error) {
    throw error;
  }

  return { read, bytes };
}

export function uint8ArrayToHex(arr) {
  checkUint8Array(arr);
  if ("detached" in arr.buffer && arr.buffer.detached) {
    throw new TypeError("toHex called on array backed by detached buffer");
  }
  let out = "";
  for (let i = 0; i < arr.length; ++i) {
    out += arr[i].toString(16).padStart(2, "0");
  }
  return out;
}

function fromHex(string, maxLength) {
  let bytes = [];
  let read = 0;
  if (maxLength > 0) {
    while (read < string.length) {
      let hexits = string.slice(read, read + 2);
      if (/[^0-9a-fA-F]/.test(hexits)) {
        let error = new SyntaxError("string should only contain hex characters");
        return { read, bytes, error };
      }
      bytes.push(parseInt(hexits, 16));
      read += 2;
      if (bytes.length === maxLength) {
        break;
      }
    }
  }
  return { read, bytes, error: null };
}

export function hexToUint8Array(string, into) {
  if (typeof string !== "string") {
    throw new TypeError("expected string to be a string");
  }
  if (into && "detached" in into.buffer && into.buffer.detached) {
    throw new TypeError("fromHexInto called on array backed by detached buffer");
  }
  if (string.length % 2 !== 0) {
    throw new SyntaxError("string should be an even number of characters");
  }

  let maxLength = into ? into.length : 2 ** 53 - 1;
  let { read, bytes, error } = fromHex(string, maxLength);
  if (error && !into) {
    throw error;
  }

  bytes = new Uint8Array(bytes);
  if (into && bytes.length > 0) {
    assert(bytes.length <= into.length);
    into.set(bytes);
  }

  if (error) {
    throw error;
  }

  return { read, bytes };
}
