// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    public class InputDateTimeType : InputType
    {
        public InputDateTimeType(DateTimeKnownEncoding encode, InputPrimitiveType wireType, bool isNullable) : base("DateTime", isNullable)
        {
            Encode = encode;
            WireType = wireType;
        }

        public DateTimeKnownEncoding Encode { get; }
        public InputPrimitiveType WireType { get; }
    }
}
