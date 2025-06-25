// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputModelProperty : InputProperty
    {
        public InputModelProperty(string name, string? summary, string? doc, InputType type, bool isRequired, bool isReadOnly, string? access, bool isDiscriminator, string serializedName, InputSerializationOptions serializationOptions) : base(name, summary, doc, type, isRequired, isReadOnly, access, serializedName)
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

        public bool IsDiscriminator { get; internal set; }
        public InputSerializationOptions? SerializationOptions { get; internal set; }

        /// <summary>
        /// Updates the properties of the input model property.
        /// </summary>
        /// <param name="name">The new name for the property.</param>
        public void Update(string? name = null)
        {
            if (name != null)
            {
                Name = name;
            }
        }
    }
}
