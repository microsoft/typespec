// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputUnionType : InputType
    {
        public InputUnionType(string name, IReadOnlyList<InputType> unionItemTypes, bool isNullable) : base(name, isNullable)
        {
            UnionItemTypes = unionItemTypes;
        }

        public IReadOnlyList<InputType> UnionItemTypes { get; internal set; }
    }
}
