// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    public class InputDateTimeType : InputType
    {
        public InputDateTimeType(DateTimeKnownEncoding encode, string name, string crossLanguageDefinitionId, InputPrimitiveType wireType, InputDateTimeType? baseType = null) : base(name)
        {
            CrossLanguageDefinitionId = crossLanguageDefinitionId;
            Encode = encode;
            WireType = wireType;
            BaseType = baseType;
        }

        public string CrossLanguageDefinitionId { get; }

        public DateTimeKnownEncoding Encode { get; }

        public InputPrimitiveType WireType { get; }

        public InputDateTimeType? BaseType { get; }
    }
}
