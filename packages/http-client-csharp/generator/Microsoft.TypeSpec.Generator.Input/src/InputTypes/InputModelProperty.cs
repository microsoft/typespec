// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputModelProperty
    {
        public InputModelProperty(string name, string? summary, string? doc, InputType type, bool isRequired, bool isReadOnly, bool isDiscriminator, InputSerializationOptions serializationOptions)
        {
            Name = name;
            Summary = summary;
            Doc = doc;
            Type = type;
            IsRequired = isRequired;
            IsReadOnly = isReadOnly;
            IsDiscriminator = isDiscriminator;
            SerializationOptions = serializationOptions;
        }

        public string Name { get; internal set; }
        public string? Summary { get; internal set; }
        public string? Doc { get; internal set; }
        public InputType Type { get; internal set; }
        public bool IsRequired { get; internal set; }
        public bool IsReadOnly { get; internal set; }
        public bool IsDiscriminator { get; internal set; }
        public InputModelType? EnclosingType { get; internal set; }
        public IReadOnlyList<InputDecoratorInfo> Decorators { get; internal set; } = new List<InputDecoratorInfo>();
        public InputSerializationOptions SerializationOptions { get; internal set; }
    }
}
