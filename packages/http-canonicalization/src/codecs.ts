import { getEncode, type MemberType, type Program, type Type } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import { isHeader } from "@typespec/http";
import type { HttpCanonicalization } from "./http-canonicalization-classes.js";

export interface CodecEncodeResult {
  codec: Codec;
  encodedType: Type;
}
export class CodecRegistry {
  $: Typekit;
  #codecs: (typeof Codec)[];
  constructor($: Typekit) {
    this.#codecs = [];
    this.$ = $;
  }

  addCodec(codec: typeof Codec) {
    this.#codecs.push(codec);
  }

  detect(type: HttpCanonicalization): Codec {
    for (const codec of this.#codecs) {
      const codecInstance = codec.detect(this.$, type);
      if (codecInstance) {
        return codecInstance;
      }
    }

    throw new Error("No codec found");
  }
}

export abstract class Codec {
  abstract id: string;
  canonicalization: HttpCanonicalization;
  $: Typekit;

  constructor($: Typekit, canonicalization: HttpCanonicalization) {
    this.canonicalization = canonicalization;
    this.$ = $;
  }

  static detect($: Typekit, canonicalization: HttpCanonicalization): Codec | undefined {
    return undefined;
  }

  abstract encode(): { languageType: Type; wireType: Type };

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
  static detect($: Typekit, canonicalization: HttpCanonicalization) {
    return new IdentityCodec($, canonicalization);
  }

  encode() {
    return {
      wireType: this.canonicalization.sourceType,
      languageType: this.canonicalization.sourceType,
    };
  }
}

export class UnixTimestamp64Codec extends Codec {
  readonly id = "unix-timestamp-64";
  static detect($: Typekit, canonicalization: HttpCanonicalization) {
    const type = canonicalization.sourceType;

    if (!$.scalar.is(type) || !$.type.isAssignableTo(type, $.builtin.utcDateTime)) {
      return;
    }

    const encodingInfo = this.getMetadata(
      $,
      type,
      canonicalization.referenceTypes,
      $.modelProperty.is,
      getEncode,
    );

    if (!encodingInfo) {
      return;
    }

    if (encodingInfo.encoding === "unix-timestamp" && encodingInfo.type === $.builtin.int64) {
      return new UnixTimestamp64Codec($, canonicalization);
    }
  }

  encode() {
    return {
      languageType: this.$.builtin.int64,
      wireType: this.$.builtin.float64,
    };
  }
}

export class UnixTimestamp32Codec extends Codec {
  readonly id = "unix-timestamp-32";
  static detect($: Typekit, canonicalization: HttpCanonicalization) {
    const type = canonicalization.sourceType;

    if (!$.scalar.is(type) || !$.type.isAssignableTo(type, $.builtin.utcDateTime)) {
      return;
    }

    const encodingInfo = this.getMetadata(
      $,
      type,
      canonicalization.referenceTypes,
      $.modelProperty.is,
      getEncode,
    );

    if (!encodingInfo) {
      return;
    }

    if (encodingInfo.encoding === "unix-timestamp" && encodingInfo.type === $.builtin.int32) {
      return new UnixTimestamp32Codec($, canonicalization);
    }
  }

  encode() {
    return {
      languageType: this.$.builtin.int32,
      wireType: this.$.builtin.float64,
    };
  }
}

export class Rfc3339Codec extends Codec {
  readonly id = "rfc3339";

  static detect($: Typekit, canonicalization: HttpCanonicalization) {
    const type = canonicalization.sourceType;

    if (!$.scalar.is(type) || !$.type.isAssignableTo(type, $.builtin.utcDateTime)) {
      return;
    }

    return new Rfc3339Codec($, canonicalization);
  }

  encode() {
    return {
      languageType: this.canonicalization.sourceType,
      wireType: this.$.builtin.string,
    };
  }
}

export class Rfc7231Codec extends Codec {
  readonly id = "rfc7231";

  static detect($: Typekit, canonicalization: HttpCanonicalization) {
    const type = canonicalization.sourceType;

    if (!$.scalar.is(type) || !$.type.isAssignableTo(type, $.builtin.utcDateTime)) {
      return;
    }

    const encodingInfo = this.getMetadata(
      $,
      type,
      canonicalization.referenceTypes,
      $.modelProperty.is,
      getEncode,
    );

    if (!encodingInfo) {
      if (
        this.getMetadata(
          $,
          undefined,
          canonicalization.referenceTypes,
          $.modelProperty.is,
          isHeader,
        )
      ) {
        return new Rfc7231Codec($, canonicalization);
      }
      return;
    }

    if (encodingInfo.encoding === "rfc7231") {
      return new Rfc7231Codec($, canonicalization);
    }
  }

  encode() {
    return {
      languageType: this.canonicalization.sourceType,
      wireType: this.$.builtin.string,
    };
  }
}

export class Base64Codec extends Codec {
  readonly id = "base64";

  static detect($: Typekit, canonicalization: HttpCanonicalization) {
    const type = canonicalization.sourceType;

    if (!$.type.isAssignableTo(type, $.builtin.bytes)) {
      return;
    }

    return new Base64Codec($, canonicalization);
  }

  encode() {
    return {
      languageType: this.canonicalization.sourceType,
      wireType: this.$.builtin.string,
    };
  }
}

export class CoerceToFloat64Codec extends Codec {
  readonly id = "coerce-to-float64";

  static detect($: Typekit, canonicalization: HttpCanonicalization) {
    const type = canonicalization.sourceType;

    if (!$.type.isAssignableTo(type, $.builtin.numeric)) {
      return;
    }

    return new CoerceToFloat64Codec($, canonicalization);
  }

  encode() {
    return {
      languageType: this.canonicalization.sourceType,
      wireType: this.$.builtin.float64,
    };
  }
}

export class NumericToStringCodec extends Codec {
  readonly id = "numeric-to-string";

  static detect($: Typekit, canonicalization: HttpCanonicalization) {
    const type = canonicalization.sourceType;

    if (!$.type.isAssignableTo(type, $.builtin.numeric)) {
      return;
    }

    return new NumericToStringCodec($, canonicalization);
  }

  encode() {
    return {
      languageType: this.canonicalization.sourceType,
      wireType: this.$.builtin.string,
    };
  }
}

export class ArrayJoinCodec extends Codec {
  readonly id = "array-join";
  static detect($: Typekit, canonicalization: HttpCanonicalization) {
    const type = canonicalization.sourceType;

    if (!$.array.is(type)) {
      return;
    }

    if (
      canonicalization.options.location === "query" ||
      canonicalization.options.location === "header" ||
      canonicalization.options.location === "path"
    ) {
      return new ArrayJoinCodec($, canonicalization);
    }
  }

  encode() {
    return {
      languageType: this.canonicalization.sourceType,
      wireType: this.$.builtin.string,
    };
  }
}

const jsonEncoderRegistryCache = new WeakMap<Program, CodecRegistry>();

export const getJsonEncoderRegistry = ($: Typekit) => {
  if (jsonEncoderRegistryCache.has($.program)) {
    return jsonEncoderRegistryCache.get($.program)!;
  }

  const registry = new CodecRegistry($);
  registry.addCodec(Rfc7231Codec);
  registry.addCodec(Rfc3339Codec);
  registry.addCodec(UnixTimestamp32Codec);
  registry.addCodec(UnixTimestamp64Codec);
  registry.addCodec(Base64Codec);
  registry.addCodec(CoerceToFloat64Codec);
  registry.addCodec(NumericToStringCodec);
  registry.addCodec(ArrayJoinCodec);
  registry.addCodec(IdentityCodec);

  jsonEncoderRegistryCache.set($.program, registry);

  return registry;
};
