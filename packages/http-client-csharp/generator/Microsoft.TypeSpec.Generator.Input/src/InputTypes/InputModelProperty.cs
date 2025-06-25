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

        public void Update(
            string? name = null,
            string? summary = null,
            string? doc = null,
            InputType? type = null,
            bool? isRequired = null,
            bool? isReadOnly = null,
            string? access = null,
            bool? isDiscriminator = null,
            string? serializedName = null,
            InputSerializationOptions? serializationOptions = null)
        {
            if (name != null)
            {
                Name = name;
            }

            if (summary != null)
            {
                Summary = summary;
            }

            if (doc != null)
            {
                Doc = doc;
            }

            if (type != null)
            {
                Type = type;
            }

            if (isRequired.HasValue)
            {
                IsRequired = isRequired.Value;
            }

            if (isReadOnly.HasValue)
            {
                IsReadOnly = isReadOnly.Value;
            }

            if (access != null)
            {
                Access = access;
            }

            if (isDiscriminator.HasValue)
            {
                IsDiscriminator = isDiscriminator.Value;
            }

            if (serializedName != null)
            {
                SerializedName = serializedName;
            }

            if (serializationOptions != null)
            {
                SerializationOptions = serializationOptions;
            }
        }
    }
}
