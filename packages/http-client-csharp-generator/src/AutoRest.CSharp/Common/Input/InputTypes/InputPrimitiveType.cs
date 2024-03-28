// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace AutoRest.CSharp.Common.Input;

internal record InputPrimitiveType(InputTypeKind Kind, bool IsNullable) : InputType(Kind.ToString(), IsNullable)
{
    private InputPrimitiveType(InputTypeKind kind) : this(kind, false) { }

    public static InputPrimitiveType AzureLocation { get; } = new(InputTypeKind.AzureLocation);
    public static InputPrimitiveType BinaryData { get; } = new(InputTypeKind.BinaryData);
    public static InputPrimitiveType Boolean { get; } = new(InputTypeKind.Boolean);
    public static InputPrimitiveType Bytes { get; } = new(InputTypeKind.Bytes);
    public static InputPrimitiveType BytesBase64Url { get; } = new(InputTypeKind.BytesBase64Url);
    public static InputPrimitiveType ContentType { get; } = new(InputTypeKind.ContentType);
    public static InputPrimitiveType Date { get; } = new(InputTypeKind.Date);
    public static InputPrimitiveType DateTime { get; } = new(InputTypeKind.DateTime);
    public static InputPrimitiveType DateTimeISO8601 { get; } = new(InputTypeKind.DateTimeISO8601);
    public static InputPrimitiveType DateTimeRFC1123 { get; } = new(InputTypeKind.DateTimeRFC1123);
    public static InputPrimitiveType DateTimeUnix { get; } = new(InputTypeKind.DateTimeUnix);
    public static InputPrimitiveType DurationISO8601 { get; } = new(InputTypeKind.DurationISO8601);
    public static InputPrimitiveType DurationConstant { get; } = new(InputTypeKind.DurationConstant);
    public static InputPrimitiveType ETag { get; } = new(InputTypeKind.ETag);
    public static InputPrimitiveType Float32 { get; } = new(InputTypeKind.Float32);
    public static InputPrimitiveType Float64 { get; } = new(InputTypeKind.Float64);
    public static InputPrimitiveType Float128 { get; } = new(InputTypeKind.Float128);
    public static InputPrimitiveType Guid { get; } = new(InputTypeKind.Guid);
    public static InputPrimitiveType Int32 { get; } = new(InputTypeKind.Int32);
    public static InputPrimitiveType Int64 { get; } = new(InputTypeKind.Int64);
    public static InputPrimitiveType IPAddress { get; } = new(InputTypeKind.IPAddress);
    public static InputPrimitiveType Object { get; } = new(InputTypeKind.Object);
    public static InputPrimitiveType RequestMethod { get; } = new(InputTypeKind.RequestMethod);
    public static InputPrimitiveType ResourceIdentifier { get; } = new(InputTypeKind.ResourceIdentifier);
    public static InputPrimitiveType ResourceType { get; } = new(InputTypeKind.ResourceType);
    public static InputPrimitiveType Stream { get; } = new(InputTypeKind.Stream);
    public static InputPrimitiveType String { get; } = new(InputTypeKind.String);
    public static InputPrimitiveType Time { get; } = new(InputTypeKind.Time);
    public static InputPrimitiveType Uri { get; } = new(InputTypeKind.Uri);

    public bool IsNumber => Kind is InputTypeKind.Int32 or InputTypeKind.Int64 or InputTypeKind.Float32 or InputTypeKind.Float64 or InputTypeKind.Float128;
}
