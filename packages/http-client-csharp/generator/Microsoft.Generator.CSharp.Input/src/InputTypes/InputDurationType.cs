// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    public class InputDurationType : InputType
    {
        public InputDurationType(DurationKnownEncoding encode, InputPrimitiveType wireType) : base("Duration")
        {
            Encode = encode;
            WireType = wireType;
        }

        public DurationKnownEncoding Encode { get; }
        public InputPrimitiveType WireType { get; }
    }
}
