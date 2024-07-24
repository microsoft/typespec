// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input.InputTypes;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputDateTimeType : InputType
    {
        public InputDateTimeType(DateTimeKnownEncoding encode, InputPrimitiveType wireType, IReadOnlyList<InputDecoratorInfo> decorators) : base("DateTime", decorators)
        {
            Encode = encode;
            WireType = wireType;
        }

        public DateTimeKnownEncoding Encode { get; }
        public InputPrimitiveType WireType { get; }
    }
}
