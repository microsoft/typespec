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

export interface EncodingInfo {
  codec: Codec;
  languageType: Type;
  wireType: Type;
}

export class CodecRegistry {
  $: Typekit;
  #codecs: Codec[];

  constructor($: Typekit) {
    this.$ = $;
    this.#codecs = [];
  }

  addCodec(codec: Codec) {
    this.#codecs.push(codec);
  }

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

export abstract class Codec {
  abstract id: string;

  abstract encode(
    $: Typekit,
    sourceType: Type,
    referenceTypes: MemberType[],
  ): { languageType: Type; wireType: Type } | null;

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

export class IdentityCodec extends Codec {
  readonly id = "identity";

  encode($: Typekit, sourceType: Type, referenceTypes: MemberType[]) {
    return {
      wireType: sourceType,
      languageType: sourceType,
    };
  }
}

export class UnixTimestamp64Codec extends Codec {
  readonly id = "unix-timestamp-64";

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

export class UnixTimestamp32Codec extends Codec {
  readonly id = "unix-timestamp-32";

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

export class Rfc3339Codec extends Codec {
  readonly id = "rfc3339";

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

export class Rfc7231Codec extends Codec {
  readonly id = "rfc7231";

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

export class Base64Codec extends Codec {
  readonly id = "base64";

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

export interface CoerceToFloat64CodecOptions {
  lossyInteger?: boolean;
  lossyDecimal?: boolean;
}

export class CoerceToFloat64Codec extends Codec {
  readonly id = "coerce-to-float64";
  options: CoerceToFloat64CodecOptions;
  constructor(options: CoerceToFloat64CodecOptions = {}) {
    super();
    this.options = options;
  }

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

export class ArrayJoinCodec extends Codec {
  readonly id = "array-join";

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

interface RenameCodecOptions {
  namer?(type: Type): string | undefined;
}
/**
 * Renames the language type according to the language's name policy and
 * friendly name decorator.
 */
export class RenameCodec extends Codec {
  readonly id = "model-property-rename";
  options: RenameCodecOptions;

  constructor(options: RenameCodecOptions = {}) {
    super();
    this.options = options;
  }

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
