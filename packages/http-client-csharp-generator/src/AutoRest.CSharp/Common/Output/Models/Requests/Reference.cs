// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models.Shared;

namespace AutoRest.CSharp.Output.Models.Requests
{
    internal readonly struct Reference
    {
        public Reference(string name, CSharpType type)
        {
            Name = name;
            Type = type;
        }

        public string Name { get; }
        public CSharpType Type { get; }

        public static implicit operator Reference(Parameter parameter) => new Reference(parameter.Name, parameter.Type);
        public static implicit operator Reference(FieldDeclaration field) => new Reference(field.Name, field.Type);
    }
}
