// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.CSharp.Output.Models.Shared;

namespace AutoRest.CSharp.Output.Models.Types
{
    internal class EnumTypeValue
    {
        public EnumTypeValue(MemberDeclarationOptions declaration, string description, Constant value)
        {
            Description = description;
            Value = value;
            Declaration = declaration;
        }

        public MemberDeclarationOptions Declaration { get; }
        public Constant Value { get; }
        public string Description { get; }
    }
}
