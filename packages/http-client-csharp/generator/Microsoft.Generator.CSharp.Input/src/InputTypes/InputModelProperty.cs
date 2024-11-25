// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputModelProperty
    {
        public InputModelProperty(string name, string serializedName, string? summary, string? doc, InputType type, bool isRequired, bool isReadOnly, bool isDiscriminator)
        {
            Name = name;
            SerializedName = serializedName;
            Summary = summary;
            Doc = doc;
            Type = type;
            IsRequired = isRequired;
            IsReadOnly = isReadOnly;
            IsDiscriminator = isDiscriminator;
        }

        public string Name { get; }
        public string SerializedName { get; }
        public string? Summary { get; }
        public string? Doc { get; }
        public InputType Type { get; }
        public bool IsRequired { get; }
        public bool IsReadOnly { get; }
        public bool IsDiscriminator { get; }
        public InputModelType? EnclosingType { get; internal set; }
        public IReadOnlyList<InputDecoratorInfo> Decorators { get; internal set; } = new List<InputDecoratorInfo>();
    }
}
