import {
  getEncode,
  getFriendlyName,
  type MemberType,
  type ModelProperty,
  type Program,
  type Type,
} from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import { isHeader } from "@typespec/http";

/** The codec selected for a source type and the two type-graph projections it produces. */
export interface EncodingInfo {
  /** First codec in the registry that accepted the source and its reference context. */
  codec: Codec;
  /** Type exposed to generated language code; may be the unmodified source type. */
  languageType: Type;
  /** Type describing the serialized representation, not an encoded runtime value. */
  wireType: Type;
}

/**
 * Selects a codec by registration order. A registry starts empty; register an
 * {@link IdentityCodec} last when unrecognized types should pass through.
 */
export class CodecRegistry {
  /** Typekit supplied to every codec when selecting a representation. */
  $: Typekit;
  #codecs: Codec[];

  /** Creates an empty registry bound to the typekit's program. */
  constructor($: Typekit) {
    this.$ = $;
    this.#codecs = [];
  }

  /** Appends a codec; previously registered codecs retain priority. */
  addCodec(codec: Codec) {
    this.#codecs.push(codec);
  }

  /**
   * Returns the first non-null codec result, together with the selected codec.
   * Reference members let codecs honor use-site metadata before type metadata.
   * @throws Error when every registered codec declines the source type.
   */
  encode(sourceType: Type, referenceTypes: MemberType[]): EncodingInfo {
    for (const codec of this.#codecs) {
      const result = codec.encode(this.$, sourceType, referenceTypes);
      if (result) {
        return { codec, ...result };
      }
    }

    throw new Error("No codec found");
  }
}

/**
 * Chooses language and wire types for a source type in its use-site context.
 * Codecs describe representations; they do not serialize or deserialize values.
 */
export abstract class Codec {
  /** Stable selection identifier, also used in scalar canonicalization cache keys. */
  abstract id: string;

  /**
   * Selects type representations, or returns `null` to let the next codec try.
   * @param referenceTypes Members referencing the source, in metadata lookup order.
   */
  abstract encode(
    $: Typekit,
    sourceType: Type,
    referenceTypes: MemberType[],
  ): {
    /** Type to use in the generated language's type graph. */
    languageType: Type;
    /** Type to use in the serialized payload's type graph. */
    wireType: Type;
  } | null;

  /**
   * Finds the first truthy metadata value on applicable reference members, then
   * falls back to the source type. The source getter's result is returned as-is;
   * without a source or a matching member value, returns `undefined`.
   */
  static getMetadata<
    TTypeSource extends Type,
    TMemberSource extends MemberType,
    TFilteredMemberSource extends TMemberSource,
    TArgs extends [],
    TReturn,
  >(
    $: Typekit,
    typeSource: TTypeSource | undefined,
    memberSource: TMemberSource[],
    isApplicableMember: (member: TMemberSource) => member is TFilteredMemberSource,
    getter: (
      program: Program,
      type: TTypeSource | TFilteredMemberSource,
      ...args: TArgs
    ) => TReturn,
    ...args: TArgs
  ): TReturn | undefined {
    for (const member of memberSource) {
      if (isApplicableMember(member)) {
        const memberInfo = getter($.program, member, ...args);
        if (memberInfo) {
          return memberInfo;
        }
      }
    }

    if (typeSource) {
      return getter($.program, typeSource, ...args);
    }

    return undefined;
  }
}

/** Fallback codec that accepts every type and preserves both representations. */
export class IdentityCodec extends Codec {
  /** Marks the result as unchanged for identity-codec predicates. */
  readonly id = "identity";

  /** Returns the source object itself for both language and wire types. */
  encode($: Typekit, sourceType: Type, referenceTypes: MemberType[]) {
    return {
      wireType: sourceType,
      languageType: sourceType,
    };
  }
}

/**
 * Recognizes UTC date-time scalars encoded as `"unix-timestamp"` with `int64`.
 * Use-site encoding metadata takes precedence over scalar metadata.
 */
export class UnixTimestamp64Codec extends Codec {
  /** Distinguishes this timestamp selection in scalar cache keys. */
  readonly id = "unix-timestamp-64";

  /** Uses builtin `utcDateTime` and `float64`, or declines nonmatching encodings. */
  encode($: Typekit, sourceType: Type, referenceTypes: MemberType[]) {
    if (!$.scalar.is(sourceType) || !$.type.isAssignableTo(sourceType, $.builtin.utcDateTime)) {
      return null;
    }

    const encodingInfo = Codec.getMetadata(
      $,
      sourceType,
      referenceTypes,
      $.modelProperty.is,
      getEncode,
    );

    if (!encodingInfo) {
      return null;
    }

    if (encodingInfo.encoding === "unix-timestamp" && encodingInfo.type === $.builtin.int64) {
      return {
        languageType: $.builtin.utcDateTime,
        wireType: $.builtin.float64,
      };
    }

    return null;
  }
}

/**
 * Recognizes UTC date-time scalars encoded as `"unixTimestamp"` with `int32`.
 * Use-site encoding metadata takes precedence over scalar metadata.
 */
export class UnixTimestamp32Codec extends Codec {
  /** Distinguishes this timestamp selection in scalar cache keys. */
  readonly id = "unix-timestamp-32";

  /** Uses builtin `utcDateTime` and `float64`, or declines nonmatching encodings. */
  encode($: Typekit, sourceType: Type, referenceTypes: MemberType[]) {
    if (!$.scalar.is(sourceType) || !$.type.isAssignableTo(sourceType, $.builtin.utcDateTime)) {
      return null;
    }

    const encodingInfo = Codec.getMetadata(
      $,
      sourceType,
      referenceTypes,
      $.modelProperty.is,
      getEncode,
    );

    if (!encodingInfo) {
      return null;
    }

    if (encodingInfo.encoding === "unixTimestamp" && encodingInfo.type === $.builtin.int32) {
      return {
        languageType: $.builtin.utcDateTime,
        wireType: $.builtin.float64,
      };
    }

    return null;
  }
}

/**
 * Fallback string representation for scalars assignable to `utcDateTime`.
 * Does not inspect encoding metadata; register more specific date codecs first.
 */
export class Rfc3339Codec extends Codec {
  /** Distinguishes the RFC 3339 selection in scalar cache keys. */
  readonly id = "rfc3339";

  /** Preserves the date-time language type and uses `string` on the wire, or declines. */
  encode($: Typekit, sourceType: Type, referenceTypes: MemberType[]) {
    if (!$.scalar.is(sourceType) || !$.type.isAssignableTo(sourceType, $.builtin.utcDateTime)) {
      return null;
    }

    return {
      languageType: sourceType,
      wireType: $.builtin.string,
    };
  }
}

/**
 * Selects the HTTP-date string representation for UTC date-time scalars.
 * Accepts explicit `rfc7231` encoding, or a header use site with no encoding.
 */
export class Rfc7231Codec extends Codec {
  /** Distinguishes the HTTP-date selection in scalar cache keys. */
  readonly id = "rfc7231";

  /** Preserves the source date-time type and uses `string` on the wire, or declines. */
  encode($: Typekit, sourceType: Type, referenceTypes: MemberType[]) {
    if (!$.scalar.is(sourceType) || !$.type.isAssignableTo(sourceType, $.builtin.utcDateTime)) {
      return null;
    }

    const encodingInfo = Codec.getMetadata(
      $,
      sourceType,
      referenceTypes,
      $.modelProperty.is,
      getEncode,
    );

    if (!encodingInfo) {
      if (Codec.getMetadata($, undefined, referenceTypes, $.modelProperty.is, isHeader)) {
        return {
          languageType: sourceType,
          wireType: $.builtin.string,
        };
      }
      return null;
    }

    if (encodingInfo.encoding === "rfc7231") {
      return {
        languageType: sourceType,
        wireType: $.builtin.string,
      };
    }

    return null;
  }
}

/**
 * Selects a string wire representation for types assignable to `bytes`.
 * This selection does not inspect an explicit encoding decorator.
 */
export class Base64Codec extends Codec {
  /** Identifies the byte-to-string representation. */
  readonly id = "base64";

  /** Preserves the byte language type and uses `string` on the wire, or declines. */
  encode($: Typekit, sourceType: Type, referenceTypes: MemberType[]) {
    if (!$.type.isAssignableTo(sourceType, $.builtin.bytes)) {
      return null;
    }

    return {
      languageType: sourceType,
      wireType: $.builtin.string,
    };
  }
}

/**
 * Optional category filters for numeric codec selection. Neither flag bypasses
 * the final requirement to extend `float`, `int32`, or `uint32`.
 */
export interface CoerceToFloat64CodecOptions {
  /** When true, additionally requires an integer or float scalar; defaults to false. */
  lossyInteger?: boolean;
  /** When true, additionally requires a decimal or float scalar; defaults to false. */
  lossyDecimal?: boolean;
}

/** Uses `float64` on the wire for scalars extending `float`, `int32`, or `uint32`. */
export class CoerceToFloat64Codec extends Codec {
  /** Identifies numeric wire coercion without a language-type replacement. */
  readonly id = "coerce-to-float64";
  /** Category filters consulted on each call; the supplied object is retained. */
  options: CoerceToFloat64CodecOptions;
  /** Creates a numeric codec with no additional category filters by default. */
  constructor(options: CoerceToFloat64CodecOptions = {}) {
    super();
    this.options = options;
  }

  /** Preserves an accepted numeric language type and uses `float64`, or returns `null`. */
  encode($: Typekit, sourceType: Type, referenceTypes: MemberType[]) {
    if (
      this.options.lossyInteger &&
      this.options.lossyDecimal &&
      !$.type.isAssignableTo(sourceType, $.builtin.numeric)
    ) {
      return null;
    } else if (
      this.options.lossyInteger &&
      !$.scalar.extendsInteger(sourceType) &&
      !$.scalar.extendsFloat(sourceType)
    ) {
      return null;
    } else if (
      this.options.lossyDecimal &&
      !$.scalar.extendsDecimal(sourceType) &&
      !$.scalar.extendsFloat(sourceType)
    ) {
      return null;
    } else if (
      !$.scalar.extendsFloat(sourceType) &&
      !$.scalar.extendsInt32(sourceType) &&
      !$.scalar.extendsUint32(sourceType)
    ) {
      return null;
    }

    return {
      languageType: sourceType,
      wireType: $.builtin.float64,
    };
  }
}

/**
 * Selects a string wire representation for any array type, regardless of HTTP
 * location. The codec does not choose a delimiter or perform the join itself.
 */
export class ArrayJoinCodec extends Codec {
  /** Identifies an array represented as a string on the wire. */
  readonly id = "array-join";

  /** Preserves the array language type and uses `string` on the wire, or declines. */
  encode($: Typekit, sourceType: Type, referenceTypes: MemberType[]) {
    if (!$.array.is(sourceType)) {
      return null;
    }

    // Note: This codec previously checked canonicalization.options.location
    // This logic may need to be refactored to pass location info differently
    return {
      languageType: sourceType,
      wireType: $.builtin.string,
    };
  }
}

/** Naming hook used after checking a property's `@friendlyName`. */
interface RenameCodecOptions {
  /** Returns a language-side property name, or `undefined` to leave it unchanged. */
  namer?(type: Type): string | undefined;
}
/**
 * Renames the language type according to the language's name policy and
 * friendly name decorator.
 */
export class RenameCodec extends Codec {
  /** Identifies a language-only model property rename. */
  readonly id = "model-property-rename";
  /** Naming configuration retained by reference and consulted for each property. */
  options: RenameCodecOptions;

  /** Creates a codec that only uses `@friendlyName` unless a naming hook is supplied. */
  constructor(options: RenameCodecOptions = {}) {
    super();
    this.options = options;
  }

  /**
   * Clones a model property with a changed language name and preserves its wire
   * type. A different, nonempty friendly name wins over the naming hook.
   * Returns `null` for other types or when neither source supplies a changed name.
   */
  encode($: Typekit, sourceType: Type, referenceTypes: MemberType[]) {
    if (!$.modelProperty.is(sourceType)) {
      return null;
    }

    if (!("name" in sourceType)) {
      return null;
    }

    const friendlyName = getFriendlyName($.program, sourceType);
    if (friendlyName && friendlyName !== sourceType.name) {
      const clonedProp = $.type.clone(sourceType as ModelProperty);
      clonedProp.name = friendlyName;
      return {
        languageType: clonedProp,
        wireType: sourceType,
      };
    }

    if (this.options.namer) {
      const name = this.options.namer(sourceType);
      if (name && name !== sourceType.name) {
        const clonedProp = $.type.clone(sourceType as ModelProperty);
        clonedProp.name = name;
        $.type.finishType(clonedProp);
        return {
          languageType: clonedProp,
          wireType: sourceType,
        };
      }
    }

    return null;
  }
}

const jsonCodecRegistryCache = new WeakMap<Program, CodecRegistry>();
/**
 * Gets the mutable default registry cached per program. Specific numeric and
 * date-time codecs precede byte, array, and rename codecs, with identity last.
 * Appending a codec to this registry cannot override its identity fallback;
 * supply a separate registry to customize selection priority.
 */
export const getJsonCodecRegistry = ($: Typekit) => {
  if (jsonCodecRegistryCache.has($.program)) {
    return jsonCodecRegistryCache.get($.program)!;
  }

  const registry = new CodecRegistry($);
  registry.addCodec(new CoerceToFloat64Codec());
  registry.addCodec(new Rfc7231Codec());
  registry.addCodec(new UnixTimestamp32Codec());
  registry.addCodec(new UnixTimestamp64Codec());
  registry.addCodec(new Rfc3339Codec());
  registry.addCodec(new Base64Codec());
  registry.addCodec(new Base64Codec());
  registry.addCodec(new ArrayJoinCodec());
  registry.addCodec(new RenameCodec());
  registry.addCodec(new IdentityCodec());

  jsonCodecRegistryCache.set($.program, registry);

  return registry;
};
