// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    public enum InputPrimitiveTypeKind
    {
        Boolean,
        Bytes,
        ContentType,
        PlainDate,
        Decimal,
        Decimal128,
        Numeric,// in typespec, numeric is the base type of all number types, see type relation: https://typespec.io/docs/language-basics/type-relations
        Float, // in typespec, float is the base type of float32 and float64, see type relation: https://typespec.io/docs/language-basics/type-relations
        Float32,
        Float64,
        Float128,
        Guid,
        Uuid,
        Integer, // in typespec, integer is the base type of int related types, see type relation: https://typespec.io/docs/language-basics/type-relations
        Int8, // aka SByte
        Int16,
        Int32,
        Int64,
        SafeInt,
        UInt8, // aka Byte
        UInt16,
        UInt32,
        UInt64,
        IPAddress,
        Stream,
        String,
        PlainTime,
        Url,
        Uri,
        Char,
        Any // aka unknown
    }
}
