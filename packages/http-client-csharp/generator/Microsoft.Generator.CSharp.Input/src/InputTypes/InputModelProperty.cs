// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input.InputTypes;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputModelProperty : InputDecoratedType
    {
        public InputModelProperty(string name, string serializedName, string description, InputType type, bool isRequired, bool isReadOnly, bool isDiscriminator, IReadOnlyList<InputDecoratorInfo> decorators, IReadOnlyList<string>? flattenedNames = null) : base(decorators)
        {
            Name = name;
            SerializedName = serializedName;
            Description = description;
            Type = type;
            IsRequired = isRequired;
            IsReadOnly = isReadOnly;
            IsDiscriminator = isDiscriminator;
            FlattenedNames = flattenedNames ?? Array.Empty<string>();
        }

        public string Name { get; }
        public string SerializedName { get; }
        public string Description { get; }
        public InputType Type { get; }
        public bool IsRequired { get; }
        public bool IsReadOnly { get; }
        public bool IsDiscriminator { get; }
        public IReadOnlyList<string> FlattenedNames { get; }
    }
}
