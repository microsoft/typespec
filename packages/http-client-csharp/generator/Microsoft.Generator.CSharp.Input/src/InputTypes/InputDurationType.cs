// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input.InputTypes;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputDurationType : InputType
    {
        public InputDurationType(DurationKnownEncoding encode, InputPrimitiveType wireType, IReadOnlyList<InputDecoratorInfo> decorators) : base("Duration", decorators)
        {
            Encode = encode;
            WireType = wireType;
        }

        public DurationKnownEncoding Encode { get; }
        public InputPrimitiveType WireType { get; }
    }
}
