// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputDurationType : InputType
    {
        public InputDurationType(DurationKnownEncoding encode, string name, string crossLanguageDefinitionId, InputPrimitiveType wireType, InputDurationType? baseType, IReadOnlyList<InputDecoratorInfo> decorators) : base(name, decorators)
        {
            CrossLanguageDefinitionId = crossLanguageDefinitionId;
            Encode = encode;
            WireType = wireType;
            BaseType = baseType;
        }

        public string CrossLanguageDefinitionId { get; }
        public DurationKnownEncoding Encode { get; }
        public InputPrimitiveType WireType { get; }
        public InputDurationType? BaseType { get; }
    }
}
