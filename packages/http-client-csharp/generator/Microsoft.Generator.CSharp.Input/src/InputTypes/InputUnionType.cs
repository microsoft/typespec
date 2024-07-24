// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input.InputTypes;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputUnionType : InputType
    {
        public InputUnionType(string name, IReadOnlyList<InputType> variantTypes, IReadOnlyList<InputDecoratorInfo> decorators) : base(name, decorators)
        {
            VariantTypes = variantTypes;
        }

        public IReadOnlyList<InputType> VariantTypes { get; internal set; }
    }
}
