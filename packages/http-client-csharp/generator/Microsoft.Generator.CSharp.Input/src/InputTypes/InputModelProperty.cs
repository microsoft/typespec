// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputModelProperty
    {
        public InputModelProperty(string name, string serializedName, string description, InputType type, bool isRequired, bool isReadOnly, bool isDiscriminator, IReadOnlyList<string>? flattenedNames = null)
        {
            Name = name;
            SerializedName = serializedName;
            Description = description;
            Type = type;
            IsRequired = isRequired;
            IsReadOnly = isReadOnly;
            IsDiscriminator = isDiscriminator;
            FlattenedNames = flattenedNames ?? [];
        }

        public string Name { get; }
        public string SerializedName { get; }
        public string Description { get; }
        public InputType Type { get; }
        public bool IsRequired { get; }
        public bool IsReadOnly { get; }
        public bool IsDiscriminator { get; }
        public InputModelType? EnclosingType { get; internal set; }
        public IReadOnlyList<string> FlattenedNames { get; }
        public IReadOnlyList<InputDecoratorInfo> Decorators { get; internal set; } = new List<InputDecoratorInfo>();
    }
}
