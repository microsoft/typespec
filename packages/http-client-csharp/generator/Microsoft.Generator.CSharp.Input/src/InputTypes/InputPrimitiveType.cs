// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    public sealed class InputPrimitiveType : InputType
    {
        public InputPrimitiveType(InputPrimitiveTypeKind kind, bool isNullable = false) : base(kind.ToString(), isNullable)
        {
            Kind = kind;
        }

        public InputPrimitiveTypeKind Kind { get; internal set; }

        public static InputPrimitiveType BinaryData { get; } = new(InputPrimitiveTypeKind.BinaryData);
        public static InputPrimitiveType Boolean { get; } = new(InputPrimitiveTypeKind.Boolean);
        public static InputPrimitiveType Bytes { get; } = new(InputPrimitiveTypeKind.Bytes);
        public static InputPrimitiveType BytesBase64Url { get; } = new(InputPrimitiveTypeKind.BytesBase64Url);
        public static InputPrimitiveType ContentType { get; } = new(InputPrimitiveTypeKind.ContentType);
        public static InputPrimitiveType Date { get; } = new(InputPrimitiveTypeKind.Date);
        public static InputPrimitiveType DateTime { get; } = new(InputPrimitiveTypeKind.DateTime);
        public static InputPrimitiveType DateTimeISO8601 { get; } = new(InputPrimitiveTypeKind.DateTimeISO8601);
        public static InputPrimitiveType DateTimeRFC1123 { get; } = new(InputPrimitiveTypeKind.DateTimeRFC1123);
        public static InputPrimitiveType DateTimeRFC3339 { get; } = new(InputPrimitiveTypeKind.DateTimeRFC3339);
        public static InputPrimitiveType DateTimeRFC7231 { get; } = new(InputPrimitiveTypeKind.DateTimeRFC7231);
        public static InputPrimitiveType DateTimeUnix { get; } = new(InputPrimitiveTypeKind.DateTimeUnix);
        public static InputPrimitiveType DurationISO8601 { get; } = new(InputPrimitiveTypeKind.DurationISO8601);
        public static InputPrimitiveType DurationConstant { get; } = new(InputPrimitiveTypeKind.DurationConstant);
        public static InputPrimitiveType ETag { get; } = new(InputPrimitiveTypeKind.ETag);
        public static InputPrimitiveType Float32 { get; } = new(InputPrimitiveTypeKind.Float32);
        public static InputPrimitiveType Float64 { get; } = new(InputPrimitiveTypeKind.Float64);
        public static InputPrimitiveType Float128 { get; } = new(InputPrimitiveTypeKind.Float128);
        public static InputPrimitiveType Guid { get; } = new(InputPrimitiveTypeKind.Guid);
        public static InputPrimitiveType Int32 { get; } = new(InputPrimitiveTypeKind.Int32);
        public static InputPrimitiveType Int64 { get; } = new(InputPrimitiveTypeKind.Int64);
        public static InputPrimitiveType IPAddress { get; } = new(InputPrimitiveTypeKind.IPAddress);
        public static InputPrimitiveType Object { get; } = new(InputPrimitiveTypeKind.Object);
        public static InputPrimitiveType RequestMethod { get; } = new(InputPrimitiveTypeKind.RequestMethod);
        public static InputPrimitiveType ResourceIdentifier { get; } = new(InputPrimitiveTypeKind.ResourceIdentifier);
        public static InputPrimitiveType ResourceType { get; } = new(InputPrimitiveTypeKind.ResourceType);
        public static InputPrimitiveType Stream { get; } = new(InputPrimitiveTypeKind.Stream);
        public static InputPrimitiveType String { get; } = new(InputPrimitiveTypeKind.String);
        public static InputPrimitiveType Time { get; } = new(InputPrimitiveTypeKind.Time);
        public static InputPrimitiveType Uri { get; } = new(InputPrimitiveTypeKind.Uri);

        public bool IsNumber => Kind is InputPrimitiveTypeKind.Int32 or InputPrimitiveTypeKind.Int64 or InputPrimitiveTypeKind.Float32 or InputPrimitiveTypeKind.Float64 or InputPrimitiveTypeKind.Float128;
    }
}
