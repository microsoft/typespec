// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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

        public string Name { get; internal set; }
        public string SerializedName { get; internal set; }
        public string Description { get; internal set; }
        public InputType Type { get; internal set; }
        public bool IsRequired { get; internal set; }
        public bool IsReadOnly { get; internal set; }
        public bool IsDiscriminator { get; internal set; }
    }
}
