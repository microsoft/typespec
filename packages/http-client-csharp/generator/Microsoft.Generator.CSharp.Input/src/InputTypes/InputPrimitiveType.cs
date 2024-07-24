// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input.InputTypes;
using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input
{
    public sealed class InputPrimitiveType : InputType
    {
        public InputPrimitiveType(InputPrimitiveTypeKind kind) : this(kind, Array.Empty<InputDecoratorInfo>())
        {
        }
        public InputPrimitiveType(InputPrimitiveTypeKind kind, IReadOnlyList<InputDecoratorInfo> decorators) : base(kind.ToString(), decorators)
        {
            Kind = kind;
        }

        public InputPrimitiveType(InputPrimitiveTypeKind kind, string? encode, bool isNullable = false) : this(kind, Array.Empty<InputDecoratorInfo>(), encode, isNullable)
        {
        }

        public InputPrimitiveType(InputPrimitiveTypeKind kind, IReadOnlyList<InputDecoratorInfo> decorators, string? encode, bool isNullable = false) : this(kind, decorators)
        {
            Encode = encode;
        }

        public InputPrimitiveTypeKind Kind { get; }
        public string? Encode { get; }

        public static InputPrimitiveType Boolean { get; } = new(InputPrimitiveTypeKind.Boolean);
        public static InputPrimitiveType Base64 { get; } = new(InputPrimitiveTypeKind.Bytes, BytesKnownEncoding.Base64);
        public static InputPrimitiveType Base64Url { get; } = new(InputPrimitiveTypeKind.Bytes, BytesKnownEncoding.Base64Url);
        public static InputPrimitiveType Char { get; } = new(InputPrimitiveTypeKind.Char);
        public static InputPrimitiveType ContentType { get; } = new(InputPrimitiveTypeKind.ContentType);
        public static InputPrimitiveType PlainDate { get; } = new(InputPrimitiveTypeKind.PlainDate);
        public static InputPrimitiveType Float32 { get; } = new(InputPrimitiveTypeKind.Float32);
        public static InputPrimitiveType Float64 { get; } = new(InputPrimitiveTypeKind.Float64);
        public static InputPrimitiveType Float128 { get; } = new(InputPrimitiveTypeKind.Float128);
        public static InputPrimitiveType Guid { get; } = new(InputPrimitiveTypeKind.Guid);
        public static InputPrimitiveType Int32 { get; } = new(InputPrimitiveTypeKind.Int32);
        public static InputPrimitiveType Int64 { get; } = new(InputPrimitiveTypeKind.Int64);
        public static InputPrimitiveType IPAddress { get; } = new(InputPrimitiveTypeKind.IPAddress);
        public static InputPrimitiveType Stream { get; } = new(InputPrimitiveTypeKind.Stream);
        public static InputPrimitiveType String { get; } = new(InputPrimitiveTypeKind.String);
        public static InputPrimitiveType PlainTime { get; } = new(InputPrimitiveTypeKind.PlainTime);
        public static InputPrimitiveType Uri { get; } = new(InputPrimitiveTypeKind.Uri);
        public static InputPrimitiveType Any { get; } = new(InputPrimitiveTypeKind.Any);

        public bool IsNumber => Kind is InputPrimitiveTypeKind.Int32 or InputPrimitiveTypeKind.Int64 or InputPrimitiveTypeKind.Float32 or InputPrimitiveTypeKind.Float64 or InputPrimitiveTypeKind.Float128;
    }
}
