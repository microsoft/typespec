import { HttpOperation, HttpOperationMultipartBody, isHttpFile } from "@typespec/http";
import { Module } from "../../ctx.js";
import { HttpContext } from "../index.js";

import { module as headerHelpers } from "../../../generated-defs/helpers/header.js";
import { module as multipartHelpers } from "../../../generated-defs/helpers/multipart.js";
import { emitTypeReference } from "../../common/reference.js";
import { requireSerialization } from "../../common/serialization/index.js";
import { requiresJsonSerialization } from "../../common/serialization/json.js";
import { parseCase } from "../../util/case.js";
import { UnimplementedError } from "../../util/error.js";

/**
 * Parse a multipart request body according to the given body spec.
 *
 * @param ctx - The emitter context.
 * @param module - The module that this parser is written into.
 * @param operation - The HTTP operation this body is being parsed for.
 * @param body - The multipart body spec
 * @param bodyName - The name of the variable to store the parsed body in.
 * @param bodyTypeName - The name of the type of the parsed body.
 */
export function* emitMultipart(
  ctx: HttpContext,
  module: Module,
  operation: HttpOperation,
  body: HttpOperationMultipartBody,
  ctxName: string,
  bodyName: string,
  bodyTypeName: string,
): Iterable<string> {
  module.imports.push(
    { binder: ["parseHeaderValueParameters"], from: headerHelpers },
    { binder: ["createMultipartReadable"], from: multipartHelpers },
  );

  yield `const ${bodyName} = await new Promise<${bodyTypeName}>(`;
  yield `// eslint-disable-next-line no-async-promise-executor`;
  yield `async function parse${bodyTypeName}MultipartRequest(resolve, reject) {`;

  // Wrap this whole thing in a try/catch because the executor is async. If anything in here throws, we want to reject the promise instead of
  // just letting the executor die and the promise never settle.
  yield `  try {`;

  const stream = ctx.gensym("stream");

  yield `  const ${stream} = createMultipartReadable(${ctxName}.request);`;
  yield "";

  const contentDisposition = ctx.gensym("contentDisposition");
  const contentType = ctx.gensym("contentType");
  const name = ctx.gensym("name");
  const fields = ctx.gensym("fields");

  yield `  const ${fields}: { [k: string]: any } = {};`;
  yield "";

  const partsWithMulti = body.parts.filter((part) => part.name && part.multi);
  const anonymousParts = body.parts.filter((part) => !part.name);
  const anonymousPartsAreMulti = anonymousParts.some((part) => part.multi);

  if (anonymousParts.length > 0) {
    throw new UnimplementedError("Anonymous parts are not yet supported in multipart parsing.");
  }

  let hadMulti = false;

  for (const partWithMulti of partsWithMulti) {
    if (!partWithMulti.optional) {
      hadMulti = true;
      const name = partWithMulti.name!;

      const propName = parseCase(name).camelCase;

      yield `    ${fields}.${propName} = [];`;
    }
  }

  if (anonymousPartsAreMulti) {
    hadMulti = true;
    yield `    const ${fields}.__anonymous = [];`;
  }

  if (hadMulti) yield "";

  const partName = ctx.gensym("part");

  yield `  for await (const ${partName} of ${stream}) {`;
  yield `    const ${contentDisposition} = parseHeaderValueParameters(${partName}.headers["content-disposition"]);`;
  yield `    if (!${contentDisposition}) {`;
  yield `      return reject("Invalid request: missing content-disposition in part.");`;
  yield `    }`;
  yield "";
  yield `    const ${contentType} = parseHeaderValueParameters(${partName}.headers["content-type"]);`;
  yield "";
  yield `    const ${name} = ${contentDisposition}.params.name ?? "";`;
  yield "";
  yield `    switch (${name}) {`;

  for (const namedPart of body.parts.filter((part) => part.name)) {
    // TODO: this is wrong. The name of the part is not necessarily the name of the property in the body.
    //       The HTTP library does not provide the property that maps to this part if it's explicitly named.
    const propName = parseCase(namedPart.name!).camelCase;

    let value = ctx.gensym("value");

    yield `      case ${JSON.stringify(namedPart.name)}: {`;
    // HTTP API is doing too much work for us. I need to know whether I'm looking at an HTTP file, and the only way to do that is to
    // look at the model that the body is a property of. This is more than a bit of a hack, but it will work for now.
    if (
      namedPart.body.contentTypeProperty?.model &&
      isHttpFile(ctx.program, namedPart.body.contentTypeProperty.model)
    ) {
      // We have an http file, so we will buffer the body and then optionally get the filename and content type.
      // TODO: support models that inherit from File and have other optional metadata. The Http.File structure
      //       doesn't make this easy to do, since it doesn't describe where the fields of the file come from in the
      //       multipart request. However, we could recognize models that extend File and handle the special fields
      //       of Http.File specially.
      // TODO: find a way to avoid buffering the entire file in memory. I have to do this to return an object that
      //       has the keys described in the TypeSpec model and because the underlying multipart stream has to be
      //       drained sequentially. Server authors could stall the stream by trying to read part bodies out of order if
      //       I represented the file contents as a stream. We will need some way to identify the whole multipart
      //       envelope and represent it as a stream of named parts. The backend for multipart streaming supports this,
      //       and it's how we receive the part data in this handler, but we don't have a way to represent it to the
      //       implementor yet.

      yield `        const __chunks = [];`;
      yield "";
      yield `        for await (const __chunk of ${partName}.body) {`;
      yield `          __chunks.push(__chunk);`;
      yield `        }`;
      yield "";

      yield `        const ${value}: { filename?: string; contentType?: string; contents: Buffer; } = { contents: Buffer.concat(__chunks) };`;
      yield "";

      yield `        if (${contentType}) {`;
      yield `          ${value}.contentType = ${contentType}.verbatim;`;
      yield `        }`;
      yield "";

      yield `        const __filename = ${contentDisposition}.params.filename;`;
      yield `        if (__filename) {`;
      yield `          ${value}.filename = __filename;`;
      yield `        }`;
    } else {
      // Not a file. We just use the given content-type to determine how to parse the body.

      yield `        if (${contentType}?.value && ${contentType}.value !== "application/json") {`;
      yield `          throw new Error("Unsupported content-type for part: " + ${contentType}.value);`;
      yield `        }`;
      yield "";

      if (namedPart.headers.length > 0) {
        // TODO: support reconstruction of mixed objects with headers and bodies.
        throw new UnimplementedError(
          "Named parts with headers are not yet supported in multipart parsing.",
        );
      }

      yield `        const __chunks = [];`;
      yield "";
      yield `        for await (const __chunk of ${partName}.body) {`;
      yield `          __chunks.push(__chunk);`;
      yield `        }`;

      yield `        const __object = JSON.parse(Buffer.concat(__chunks).toString("utf-8"));`;
      yield "";

      if (requiresJsonSerialization(ctx, module, namedPart.body.type)) {
        const bodyTypeReference = emitTypeReference(
          ctx,
          namedPart.body.type,
          namedPart.body.property ?? namedPart.body.type,
          module,
          { altName: bodyTypeName + "Body", requireDeclaration: true },
        );

        requireSerialization(ctx, namedPart.body.type, "application/json");

        value = `${bodyTypeReference}.fromJsonObject(__object)`;
      } else {
        value = "__object";
      }
    }
    if (namedPart.multi) {
      if (namedPart.optional) {
        yield `        (${fields}.${propName} ??= []).push(${value});`;
      } else {
        yield `        ${fields}.${propName}.push(${value});`;
      }
    } else {
      yield `        ${fields}.${propName} = ${value};`;
    }
    yield `        break;`;
    yield `      }`;
  }

  if (anonymousParts.length > 0) {
    yield `      "": {`;
    if (anonymousPartsAreMulti) {
      yield `        ${fields}.__anonymous.push({`;
      yield `          headers: ${partName}.headers,`;
      yield `          body: ${partName}.body,`;
      yield `        });`;
      yield `        break;`;
    } else {
      yield `        ${fields}.__anonymous = {}`;
      yield `        break;`;
    }
    yield `      }`;
  }

  yield `      default: {`;
  yield `        reject("Invalid request: unknown part name.");`;
  yield `        return;`;
  yield `      }`;
  yield `    }`;
  yield `  }`;
  yield "";

  yield `  resolve(${fields} as ${bodyTypeName});`;

  yield `  } catch (err) { reject(err); }`;

  yield "});";
}

// This function is old and broken. I'm not likely to fix it unless we decide to continue supporting legacy multipart
// parsing after 1.0.
export function* emitMultipartLegacy(
  ctxName: string,
  bodyName: string,
  bodyTypeName: string,
): Iterable<string> {
  yield `const ${bodyName} = await new Promise(function parse${bodyTypeName}MultipartRequest(resolve, reject) {`;
  yield `  const boundary = ${ctxName}.request.headers["content-type"]?.split(";").find((s) => s.includes("boundary="))?.split("=", 2)[1];`;
  yield `  if (!boundary) {`;
  yield `    return reject("Invalid request: missing boundary in content-type.");`;
  yield `  }`;
  yield "";
  yield `  const chunks: Array<Buffer> = [];`;
  yield `  ${ctxName}.request.on("data", function appendChunk(chunk) { chunks.push(chunk); });`;
  yield `  ${ctxName}.request.on("end", function finalize() {`;
  yield `    const text = Buffer.concat(chunks).toString();`;
  yield `    const parts = text.split(boundary).slice(1, -1);`;
  yield `    const fields: { [k: string]: any } = {};`;
  yield "";
  yield `    for (const part of parts) {`;
  yield `      const [headerText, body] = part.split("\\r\\n\\r\\n", 2);`;
  yield "      const headers = Object.fromEntries(";
  yield `        headerText.split("\\r\\n").map((line) => line.split(": ", 2))`;
  yield "      ) as { [k: string]: string };";
  yield `      const name = headers["Content-Disposition"].split("name=\\"")[1].split("\\"")[0];`;
  yield `      const contentType = headers["Content-Type"] ?? "text/plain";`;
  yield "";
  yield `      switch (contentType) {`;
  yield `        case "application/json":`;
  yield `          fields[name] = JSON.parse(body);`;
  yield `          break;`;
  yield `        case "application/octet-stream":`;
  yield `          fields[name] = Buffer.from(body, "utf-8");`;
  yield `          break;`;
  yield `        default:`;
  yield `          fields[name] = body;`;
  yield `      }`;
  yield `    }`;
  yield "";
  yield `    resolve(fields as ${bodyTypeName});`;
  yield `  });`;
  yield `}) as ${bodyTypeName};`;
}
