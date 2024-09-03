// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    public sealed class InputPrimitiveType : InputType
    {
        public InputPrimitiveType(InputPrimitiveTypeKind kind, string name, string crossLanguageDefinitionId) : base(name)
        {
            Kind = kind;
            CrossLanguageDefinitionId = crossLanguageDefinitionId;
        }

        public InputPrimitiveType(InputPrimitiveTypeKind kind, string name, string crossLanguageDefinitionId, string? encode) : this(kind, name, crossLanguageDefinitionId)
        {
            Encode = encode;
        }

        public InputPrimitiveType(InputPrimitiveTypeKind kind, string name, string crossLanguageDefinitionId, string? encode, InputPrimitiveType? baseType) : this(kind, name, crossLanguageDefinitionId, encode)
        {
            BaseType = baseType;
        }

        public InputPrimitiveTypeKind Kind { get; }
        public string? Encode { get; }
        public string CrossLanguageDefinitionId { get; }
        public InputPrimitiveType? BaseType { get; }

        public static InputPrimitiveType Boolean { get; } = new(InputPrimitiveTypeKind.Boolean, "boolean", "TypeSpec.bool");
        public static InputPrimitiveType Base64 { get; } = new(InputPrimitiveTypeKind.Bytes, "bytes", "TypeSpec.bytes", BytesKnownEncoding.Base64);
        public static InputPrimitiveType Base64Url { get; } = new(InputPrimitiveTypeKind.Bytes, "bytes", "TypeSpec.bytes", BytesKnownEncoding.Base64Url);
        public static InputPrimitiveType PlainDate { get; } = new(InputPrimitiveTypeKind.PlainDate, "plainDate", "TypeSpec.plainDate");
        public static InputPrimitiveType Float32 { get; } = new(InputPrimitiveTypeKind.Float32, "float32", "TypeSpec.float32");
        public static InputPrimitiveType Float64 { get; } = new(InputPrimitiveTypeKind.Float64, "float64", "TypeSpec.float64");
        public static InputPrimitiveType Int32 { get; } = new(InputPrimitiveTypeKind.Int32, "int32", "TypeSpec.int32");
        public static InputPrimitiveType Int64 { get; } = new(InputPrimitiveTypeKind.Int64, "int64", "TypeSpec.int64");
        public static InputPrimitiveType String { get; } = new(InputPrimitiveTypeKind.String, "string", "TypeSpec.string");
        public static InputPrimitiveType PlainTime { get; } = new(InputPrimitiveTypeKind.PlainTime, "plainTime", "TypeSpec.plainTime");
        public static InputPrimitiveType Any { get; } = new(InputPrimitiveTypeKind.Any, "any", string.Empty);

        public bool IsNumber => Kind is InputPrimitiveTypeKind.Integer or InputPrimitiveTypeKind.Float or InputPrimitiveTypeKind.Int32 or InputPrimitiveTypeKind.Int64 or InputPrimitiveTypeKind.Float32 or InputPrimitiveTypeKind.Float64 or InputPrimitiveTypeKind.Decimal or InputPrimitiveTypeKind.Decimal128 or InputPrimitiveTypeKind.Numeric;
    }
}
