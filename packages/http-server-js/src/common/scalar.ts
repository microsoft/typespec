// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { DiagnosticTarget, NoTarget, Program, Scalar } from "@typespec/compiler";
import { JsContext, Module } from "../ctx.js";
import { reportDiagnostic } from "../lib.js";
import { parseCase } from "../util/case.js";
import { getFullyQualifiedTypeName } from "../util/name.js";

import { HttpOperationParameter } from "@typespec/http";
import { module as dateTimeModule } from "../../generated-defs/helpers/datetime.js";
import { UnreachableError } from "../util/error.js";

/**
 * A specification of a TypeSpec scalar type.
 */
export interface ScalarInfo {
  /**
   * The TypeScript type that represents the scalar, or a function if the scalar requires a representation
   * that is not built-in.
   */
  type: MaybeDependent<string>;

  /**
   * A map of supported encodings for the scalar.
   */
  encodings?: {
    [target: string]: {
      /**
       * The default encoding for the target.
       */
      default?: MaybeDependent<ScalarEncoding>;

      /**
       * The encoding for the scalar when encoded using a particular method.
       */
      [encoding: string]: MaybeDependent<ScalarEncoding> | undefined;
    };
  };

  /**
   * A map of default encodings for the scalar.
   */
  defaultEncodings?: {
    /**
     * The default encoding pair to use for a given MIME type.
     */
    byMimeType?: { [contentType: string]: [string, string] };
    /**
     * The default encoding pair to use in the context of HTTP metadata.
     */
    http?: {
      [K in HttpOperationParameter["type"]]?: [string, string];
    };
  };

  /**
   * Whether or not this scalar can serve as a JSON-compatible type.
   *
   * If JSON serialization reaches a non-compatible scalar and no more encodings are available, it is treated as
   * an unknown type.
   */
  isJsonCompatible: boolean;
}

/**
 * A function that resolves a value dependent on the context and module it's requested from.
 */
export interface Dependent<T> {
  (ctx: JsContext, module: Module): T;
}

/**
 * A value that might be dependent.
 */
export type MaybeDependent<T> = T | Dependent<T>;

/**
 * A definition of a scalar encoding.
 */
export type ScalarEncoding = ScalarEncodingTemplates | ScalarEncodingVia;

/**
 * A definition of a scalar encoding with templates.
 */
export interface ScalarEncodingTemplates {
  /**
   * The template to use to encode the scalar.
   *
   * The position of the string "{}" in the template will be replaced with the value to encode.
   */
  encodeTemplate: MaybeDependent<string>;

  /**
   * The template to use to decode the scalar.
   *
   * The position of the string "{}" in the template will be replaced with the value to decode.
   */
  decodeTemplate: MaybeDependent<string>;
}

export interface ScalarEncodingVia {
  /**
   * If set, the name of the encoding to use as a base for this encoding.
   *
   * This can be used to define an encoding that is a modification of another encoding, such as a URL-encoded version
   * of a base64-encoded value, which depends on the base64 encoding.
   */
  via: string;

  /**
   * Optional encoding template, defaults to "{}"
   */
  encodeTemplate?: MaybeDependent<string>;

  /**
   * Optional decoding template, defaults to "{}"
   */
  decodeTemplate?: MaybeDependent<string>;
}

/**
 * Resolves the encoding of Duration values to a number of seconds.
 */
const DURATION_NUMBER_ENCODING: Dependent<ScalarEncoding> = (_, module) => {
  module.imports.push({ from: dateTimeModule, binder: ["Duration"] });

  return {
    encodeTemplate: "Duration.totalSeconds({})",
    decodeTemplate: "Duration.fromSeconds({})",
  };
};

/**
 * Resolves the encoding of Duration values to a BigInt number of seconds.
 */
const DURATION_BIGINT_ENCODING: Dependent<ScalarEncoding> = (_, module) => {
  module.imports.push({ from: dateTimeModule, binder: ["Duration"] });

  return {
    encodeTemplate: "Duration.totalSecondsBigInt({})",
    decodeTemplate: "Duration.fromSeconds(globalThis.Number({}))",
  };
};

const TYPESPEC_DURATION: ScalarInfo = {
  type: function importDuration(_, module) {
    module.imports.push({ from: dateTimeModule, binder: ["Duration"] });

    return "Duration";
  },
  encodings: {
    "TypeSpec.string": {
      default: {
        via: "iso8601",
      },
      iso8601: function importDurationForEncode(_, module) {
        module.imports.push({ from: dateTimeModule, binder: ["Duration"] });
        return {
          encodeTemplate: "Duration.toISO8601({})",
          decodeTemplate: "Duration.parseISO8601({})",
        };
      },
    },
    ...Object.fromEntries(
      ["int32", "uint32"].map((n) => [
        `TypeSpec.${n}`,
        {
          default: { via: "seconds" },
          seconds: DURATION_NUMBER_ENCODING,
        },
      ]),
    ),
    ...Object.fromEntries(
      ["int64", "uint64"].map((n) => [
        `TypeSpec.${n}`,
        {
          default: { via: "seconds" },
          seconds: DURATION_BIGINT_ENCODING,
        },
      ]),
    ),
  },
  defaultEncodings: {
    byMimeType: {
      "application/json": ["TypeSpec.string", "iso8601"],
    },
  },
  isJsonCompatible: false,
};

const NUMBER: ScalarInfo = {
  type: "number",
  encodings: {
    "TypeSpec.string": {
      default: {
        encodeTemplate: "globalThis.String({})",
        decodeTemplate: "globalThis.Number({})",
      },
    },
  },
  isJsonCompatible: true,
};

/**
 * Declarative scalar table.
 *
 * This table defines how TypeSpec scalars are represented in JS/TS.
 *
 * The entries are the fully-qualified names of scalars, and the values are objects that describe how the scalar
 * is represented.
 *
 * Each representation has a `type`, indicating the TypeScript type that represents the scalar at runtime.
 *
 * The `encodings` object describes how the scalar can be encoded/decoded to/from other types. Encodings
 * are named, and each encoding has an `encodeTemplate` and `decodeTemplate` that describe how to encode and decode
 * the scalar to/from the target type using the encoding. Encodings can also optionally have a `via` field that
 * indicates that the encoding is a modification of the data yielded by another encoding.
 *
 * The `defaultEncodings` object describes the default encodings to use for the scalar in various contexts. The
 * `byMimeType` object maps MIME types to encoding pairs, and the `http` object maps HTTP metadata contexts to
 * encoding pairs.
 */
const SCALARS = new Map<string, ScalarInfo>([
  [
    "TypeSpec.bytes",
    {
      type: "Uint8Array",
      encodings: {
        "TypeSpec.string": {
          base64: {
            encodeTemplate:
              "({} instanceof globalThis.Buffer ? {} : globalThis.Buffer.from({})).toString('base64')",
            decodeTemplate: "globalThis.Buffer.from({}, 'base64')",
          },
          base64url: {
            via: "base64",
            encodeTemplate: "globalThis.encodeURIComponent({})",
            decodeTemplate: "globalThis.decodeURIComponent({})",
          },
        },
      },
      defaultEncodings: {
        byMimeType: { "application/json": ["TypeSpec.string", "base64"] },
      },
      isJsonCompatible: false,
    },
  ],
  [
    "TypeSpec.boolean",
    {
      type: "boolean",
      encodings: {
        "TypeSpec.string": {
          default: {
            encodeTemplate: "globalThis.String({})",
            decodeTemplate: '({} === "false" ? false : globalThis.Boolean({}))',
          },
        },
      },
      isJsonCompatible: true,
    },
  ],
  [
    "TypeSpec.string",
    {
      type: "string",
      // This little no-op encoding makes it so that we can attempt to encode string to itself infallibly and it will
      // do nothing. We therefore don't need to redundantly describe HTTP encodings for query, header, etc. because
      // they rely on the ["TypeSpec.string", "default"] encoding in the absence of a more specific encoding.
      encodings: {
        "TypeSpec.string": {
          default: { encodeTemplate: "{}", decodeTemplate: "{}" },
        },
      },
      isJsonCompatible: true,
    },
  ],

  ["TypeSpec.float32", NUMBER],
  ["TypeSpec.float64", NUMBER],
  ["TypeSpec.uint32", NUMBER],
  ["TypeSpec.uint16", NUMBER],
  ["TypeSpec.uint8", NUMBER],
  ["TypeSpec.int32", NUMBER],
  ["TypeSpec.int16", NUMBER],
  ["TypeSpec.int8", NUMBER],
  ["TypeSpec.safeint", NUMBER],

  [
    "TypeSpec.integer",
    {
      type: "bigint",
      encodings: {
        "TypeSpec.string": {
          default: {
            encodeTemplate: "globalThis.String({})",
            decodeTemplate: "globalThis.BigInt({})",
          },
        },
      },
      isJsonCompatible: false,
    },
  ],
  ["TypeSpec.plainDate", { type: "Date", isJsonCompatible: false }],
  ["TypeSpec.plainTime", { type: "Date", isJsonCompatible: false }],
  ["TypeSpec.utcDateTime", { type: "Date", isJsonCompatible: false }],
  ["TypeSpec.offsetDateTime", { type: "Date", isJsonCompatible: false }],
  ["TypeSpec.unixTimestamp32", { type: "Date", isJsonCompatible: false }],
  ["TypeSpec.duration", TYPESPEC_DURATION],
]);

/**
 * Emits a declaration for a scalar type.
 *
 * This is rare in TypeScript, as the scalar will ordinarily be used inline, but may be desirable in some cases.
 *
 * @param ctx - The emitter context.
 * @param module - The module that the scalar is being emitted in.
 * @param scalar - The scalar to emit.
 * @returns a string that declares an alias to the scalar type in TypeScript.
 */
export function emitScalar(ctx: JsContext, scalar: Scalar, module: Module): string {
  const jsScalar = getJsScalar(ctx, module, scalar, scalar.node.id);

  const name = parseCase(scalar.name).pascalCase;

  return `type ${name} = ${jsScalar.type};`;
}

/**
 * Helper function template that makes any type T computable sensitive to the JsContext and module it is referenced from.
 */
interface Contextualized<T> {
  (ctx: JsContext, module: Module): T;
}

/**
 * The store of scalars for a given program.
 */
type ScalarStore = Map<Scalar, Contextualized<JsScalar>>;

/**
 * The store of all scalars known to the emitter in all active Programs.
 */
const __JS_SCALARS_MAP = new WeakMap<Program, ScalarStore>();

/**
 * Gets the scalar store for a given program.
 */
function getScalarStore(program: Program): ScalarStore {
  let scalars = __JS_SCALARS_MAP.get(program);

  if (scalars === undefined) {
    scalars = createScalarStore(program);
    __JS_SCALARS_MAP.set(program, scalars);
  }

  return scalars;
}

/**
 * Initializes a scalar store for a given program.
 */
function createScalarStore(program: Program): ScalarStore {
  const m = new Map<Scalar, Contextualized<JsScalar>>();

  for (const [scalarName, scalarInfo] of SCALARS) {
    const [scalar, diagnostics] = program.resolveTypeReference(scalarName);

    if (diagnostics.length > 0 || !scalar || scalar.kind !== "Scalar") {
      throw new UnreachableError(`Failed to resolve built-in scalar '${scalarName}'`);
    }

    m.set(scalar, createJsScalar(program, scalar, scalarInfo, m));
  }

  return m;
}

/**
 * Binds a ScalarInfo specification to a JsScalar.
 *
 * @param program - The program that contains the scalar.
 * @param scalar - The scalar to bind.
 * @param scalarInfo - The scalar information spec to bind.
 * @param store - The scalar store to use for the scalar.
 * @returns a function that takes a JsContext and Module and returns a JsScalar.
 */
function createJsScalar(
  program: Program,
  scalar: Scalar,
  scalarInfo: ScalarInfo,
  store: ScalarStore,
): Contextualized<JsScalar> {
  return (ctx, module) => {
    const _http: { [K in HttpOperationParameter["type"]]?: Encoder } = {};
    let _type: string | undefined = undefined;

    const self = {
      get type() {
        return (_type ??=
          typeof scalarInfo.type === "function" ? scalarInfo.type(ctx, module) : scalarInfo.type);
      },

      scalar,

      getEncoding(encoding: string, target: Scalar): Encoder | undefined {
        encoding = encoding.toLowerCase();
        let encodingSpec = scalarInfo.encodings?.[getFullyQualifiedTypeName(target)]?.[encoding];

        if (encodingSpec === undefined) {
          return undefined;
        }

        encodingSpec =
          typeof encodingSpec === "function" ? encodingSpec(ctx, module) : encodingSpec;

        let _target: JsScalar | undefined = undefined;
        let _decodeTemplate: string | undefined = undefined;
        let _encodeTemplate: string | undefined = undefined;

        return {
          get target() {
            return (_target ??= store.get(target)!(ctx, module));
          },

          decode(subject) {
            _decodeTemplate ??=
              typeof encodingSpec.decodeTemplate === "function"
                ? encodingSpec.decodeTemplate(ctx, module)
                : (encodingSpec.decodeTemplate ?? "{}");

            subject = `(${subject})`;

            // If we have a via, decode it last

            subject = _decodeTemplate.replaceAll("{}", subject);

            if (isVia(encodingSpec)) {
              const via = self.getEncoding(encodingSpec.via, target);

              if (via === undefined) {
                return subject;
              }

              subject = via.decode(subject);
            }

            return subject;
          },

          encode(subject) {
            _encodeTemplate ??=
              typeof encodingSpec.encodeTemplate === "function"
                ? encodingSpec.encodeTemplate(ctx, module)
                : (encodingSpec.encodeTemplate ?? "{}");

            subject = `(${subject})`;

            // If we have a via, encode to it first

            if (isVia(encodingSpec)) {
              const via = self.getEncoding(encodingSpec.via, target);

              if (via === undefined) {
                return subject;
              }

              subject = via.encode(subject);
            }

            subject = _encodeTemplate.replaceAll("{}", subject);

            return subject;
          },
        };
      },

      getDefaultMimeEncoding(target: string): Encoder | undefined {
        const encoding = scalarInfo.defaultEncodings?.byMimeType?.[target];

        if (encoding === undefined) {
          return undefined;
        }

        const [encodingType, encodingName] = encoding;

        const [encodingScalar, diagnostics] = program.resolveTypeReference(encodingType);

        if (diagnostics.length > 0 || !encodingScalar || encodingScalar.kind !== "Scalar") {
          throw new UnreachableError(`Failed to resolve built-in scalar '${encodingType}'`);
        }

        return self.getEncoding(encodingName, encodingScalar);
      },

      http: {
        get header(): Encoder {
          return (_http.header ??= getHttpEncoder(ctx, module, self, "header"));
        },
        get query(): Encoder {
          return (_http.query ??= getHttpEncoder(ctx, module, self, "query"));
        },
        get cookie(): Encoder {
          return (_http.cookie ??= getHttpEncoder(ctx, module, self, "cookie"));
        },
        get path(): Encoder {
          return (_http.path ??= getHttpEncoder(ctx, module, self, "path"));
        },
      },

      isJsonCompatible: scalarInfo.isJsonCompatible,
    };

    return self;
  };

  /**
   * Helper to get the HTTP encoders for the scalar.
   */
  function getHttpEncoder(
    ctx: JsContext,
    module: Module,
    self: JsScalar,
    form: HttpOperationParameter["type"],
  ) {
    const [target, encoding] = scalarInfo.defaultEncodings?.http?.[form] ?? [
      "TypeSpec.string",
      "default",
    ];

    const [targetScalar, diagnostics] = program.resolveTypeReference(target);

    if (diagnostics.length > 0 || !targetScalar || targetScalar.kind !== "Scalar") {
      throw new UnreachableError(`Failed to resolve built-in scalar '${target}'`);
    }

    let encoder = self.getEncoding(encoding, targetScalar);

    if (encoder === undefined && scalarInfo.defaultEncodings?.http?.[form]) {
      throw new UnreachableError(`Default HTTP ${form} encoding specified but failed to resolve.`);
    }

    encoder ??= getDefaultHttpStringEncoder(ctx, module, form);

    return encoder;
  }
}

/**
 * Returns `true` if the encoding is provided `via` another encoding. False otherwise.
 */
function isVia(encoding: ScalarEncoding): encoding is ScalarEncodingVia {
  return "via" in encoding;
}

/** Map to ensure we don't report the same unrecognized scalar many times. */
const REPORTED_UNRECOGNIZED_SCALARS = new WeakMap<Program, Set<Scalar>>();

/**
 * Reports a scalar as unrecognized, so that the spec author knows it is treated as `unknown`.
 *
 * @param ctx - The emitter context.
 * @param scalar - The scalar that was not recognized.
 * @param target - The diagnostic target to report the error on.
 */
export function reportUnrecognizedScalar(
  ctx: JsContext,
  scalar: Scalar,
  target: DiagnosticTarget | typeof NoTarget,
) {
  let reported = REPORTED_UNRECOGNIZED_SCALARS.get(ctx.program);

  if (reported === undefined) {
    reported = new Set();
    REPORTED_UNRECOGNIZED_SCALARS.set(ctx.program, reported);
  }

  if (reported.has(scalar)) {
    return;
  }

  reportDiagnostic(ctx.program, {
    code: "unrecognized-scalar",
    target: target,
    format: {
      scalar: getFullyQualifiedTypeName(scalar),
    },
  });

  reported.add(scalar);
}

/**
 * Gets the default string encoder for HTTP metadata.
 */
function getDefaultHttpStringEncoder(
  ctx: JsContext,
  module: Module,
  form: HttpOperationParameter["type"],
): Encoder {
  const string = ctx.program.checker.getStdType("string");

  const scalar = getJsScalar(ctx, module, string, NoTarget);

  return {
    target: scalar,
    encode: HTTP_ENCODE_STRING,
    decode: HTTP_DECODE_STRING,
  };
}

// Encoders for HTTP metadata.
const HTTP_ENCODE_STRING: Encoder["encode"] = (subject) => `JSON.stringify(${subject})`;
const HTTP_DECODE_STRING: Encoder["decode"] = (subject) => `JSON.parse(${subject})`;

/**
 * An encoder that encodes a scalar type to the `target` scalar type.
 *
 * The type that this encoder encodes _from_ is the type of the scalar that it is bound to. It _MUST_ be used only with expressions
 * of the type that represents the source scalar.
 */
export interface Encoder {
  /**
   * The target scalar type that this encoder encodes to.
   */
  readonly target: JsScalar;

  /**
   * Produces an expression that encodes the `subject` expression of the source type into the target.
   *
   * @param subject - An expression of the type that represents the source scalar.
   */
  encode(subject: string): string;

  /**
   * Produces an expression that decodes the `subject` expression from the target into the source type.
   *
   * @param subject - An expression of the type that represents the target scalar.
   */
  decode(subject: string): string;
}

/**
 * A representation of a TypeSpec scalar in TypeScript.
 */
export interface JsScalar {
  /**
   * The TypeScript type that represents the scalar.
   */
  readonly type: string;

  /**
   * The TypeSpec scalar that it represents, or "unknown" if the Scalar is not recognized.
   */
  readonly scalar: Scalar | "unknown";

  /**
   * Get an encoder that encodes this scalar type to a different scalar type using a given encoding.
   *
   * @param encoding - the encoding to use (e.g. "base64", "base64url", etc.)
   * @param target - the target scalar type to encode to
   * @returns an encoder that encodes this scalar type to the target scalar type using the given encoding, or undefined
   * if the encoding is not supported.
   */
  getEncoding(encoding: string, target: Scalar): Encoder | undefined;

  /**
   * Get the default encoder for a given media type.
   *
   * @param mimeType - the media type to get the default encoder for (e.g. "application/json", "text/plain", etc.)
   * @returns an encoder that encodes this scalar type to the target scalar type using the given encoding, or undefined
   * if no default encoder is defined for the given media type.
   */
  getDefaultMimeEncoding(mimeType: string): Encoder | undefined;

  /**
   * Whether this scalar can be used directly in JSON serialization.
   *
   * If true, this scalar will be represented faithfully if it is passed to JSON.stringify or JSON.parse.
   */
  isJsonCompatible: boolean;

  /**
   * A map of encoders when this type is used in HTTP metadata.
   */
  readonly http: {
    readonly [K in HttpOperationParameter["type"]]: Encoder;
  };
}

/**
 * A dummy encoder that just converts the value to a string and does not decode it.
 *
 * This is used for "unknown" scalars.
 */
const DEFAULT_STRING_ENCODER_RAW: Omit<Encoder, "target"> = {
  encode(subject) {
    return `String(${subject})`;
  },
  decode(subject) {
    return `${subject}`;
  },
};

/**
 * A JsScalar value that represents an unknown scalar.
 */
export const JS_SCALAR_UNKNOWN: JsScalar = {
  type: "unknown",
  scalar: "unknown",
  getEncoding: () => undefined,
  getDefaultMimeEncoding: () => undefined,
  http: {
    get header() {
      return {
        target: JS_SCALAR_UNKNOWN,
        ...DEFAULT_STRING_ENCODER_RAW,
      };
    },
    get query() {
      return {
        target: JS_SCALAR_UNKNOWN,
        ...DEFAULT_STRING_ENCODER_RAW,
      };
    },
    get cookie() {
      return {
        target: JS_SCALAR_UNKNOWN,
        ...DEFAULT_STRING_ENCODER_RAW,
      };
    },
    get path() {
      return {
        target: JS_SCALAR_UNKNOWN,
        ...DEFAULT_STRING_ENCODER_RAW,
      };
    },
  },
  isJsonCompatible: true,
};

/**
 * Gets a TypeScript type that can represent a given TypeSpec scalar.
 *
 * Scalar recognition is recursive. If a scalar is not recognized, we will treat it as its parent scalar and try again.
 *
 * If no scalar in the chain is recognized, it will be treated as `unknown` and a warning will be issued.
 *
 * @param program - The program that contains the scalar
 * @param scalar - The scalar to get the TypeScript type for
 * @param diagnosticTarget - Where to report a diagnostic if the scalar is not recognized.
 * @returns a string containing a TypeScript type that can represent the scalar
 */
export function getJsScalar(
  ctx: JsContext,
  module: Module,
  scalar: Scalar,
  diagnosticTarget: DiagnosticTarget | typeof NoTarget,
): JsScalar {
  const scalars = getScalarStore(ctx.program);

  let _scalar: Scalar | undefined = scalar;

  while (_scalar !== undefined) {
    const jsScalar = scalars.get(_scalar);

    if (jsScalar !== undefined) {
      return jsScalar(ctx, module);
    }

    _scalar = _scalar.baseScalar;
  }

  reportUnrecognizedScalar(ctx, scalar, diagnosticTarget);

  return JS_SCALAR_UNKNOWN;
}
