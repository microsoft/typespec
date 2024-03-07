// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Generation.Types;

namespace AutoRest.CSharp.Output.Models.Types
{
    internal class MemberDeclarationOptions
    {
        public MemberDeclarationOptions(string accessibility, string name, CSharpType type)
        {
            Accessibility = accessibility;
            Name = name;
            Type = type;
        }

        public string Accessibility { get; }
        public string Name { get; }
        public CSharpType Type { get; }
    }
}
