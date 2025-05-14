// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputModelProperty : InputProperty
    {
        public InputModelProperty(string name, string? summary, string? doc, InputType type, bool isRequired, bool isReadOnly, string? access, bool isDiscriminator, string? serializedName, InputSerializationOptions serializationOptions) : base(name, summary, doc, type, isRequired, isReadOnly, access)
        {
            Name = name;
            Summary = summary;
            Doc = doc;
            Type = type;
            IsRequired = isRequired;
            IsReadOnly = isReadOnly;
            IsDiscriminator = isDiscriminator;
            SerializationOptions = serializationOptions;
            DefaultSerializedName = serializedName;
        }

        public bool IsDiscriminator { get; internal set; }
        public InputSerializationOptions? SerializationOptions { get; internal set; }
        public string SerializedName => SerializationOptions?.Json?.Name ?? DefaultSerializedName ?? Name;

        // Properties that do not correspond to a body model property may not have serialization options
        // but they can still have a serialized name.
        internal string? DefaultSerializedName { get; set; }
    }
}
