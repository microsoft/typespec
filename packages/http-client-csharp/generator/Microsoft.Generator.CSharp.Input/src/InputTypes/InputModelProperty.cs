// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputModelProperty
    {
        public InputModelProperty(string name, string serializedName, string description, InputType type, bool isRequired, bool isReadOnly, bool isDiscriminator)
        {
            Name = name;
            SerializedName = serializedName;
            Description = description;
            Type = type;
            IsRequired = isRequired;
            IsReadOnly = isReadOnly;
            IsDiscriminator = isDiscriminator;
        }

        public string Name { get; }
        public string SerializedName { get; }
        public string Description { get; }
        public InputType Type { get; }
        public bool IsRequired { get; }
        public bool IsReadOnly { get; }
        public bool IsDiscriminator { get; }
        public FormattableString? DefaultValue { get; init; }
    }
}
