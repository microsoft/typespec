// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputUnionType : InputType
    {
        public InputUnionType(string name, IReadOnlyList<InputType> variantTypes) : base(name)
        {
            VariantTypes = variantTypes;
        }

        public IReadOnlyList<InputType> VariantTypes { get; internal set; }
    }
}
