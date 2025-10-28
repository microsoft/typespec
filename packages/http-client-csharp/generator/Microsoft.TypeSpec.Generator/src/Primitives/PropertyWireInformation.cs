// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Input;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    public class PropertyWireInformation : WireInformation
    {
        public bool IsRequired { get; }
        public bool IsReadOnly { get; }
        public bool IsNullable { get; }
        public bool IsDiscriminator { get; }
        public bool IsHttpMetadata { get; }

        public PropertyWireInformation(SerializationFormat serializationFormat, bool isRequired, bool isReadOnly, bool isNullable, bool isDiscriminator, string serializedName, bool isHttpMetadata)
            : base(serializationFormat, serializedName)
        {
            IsRequired = isRequired;
            IsReadOnly = isReadOnly;
            IsNullable = isNullable;
            IsDiscriminator = isDiscriminator;
            IsHttpMetadata = isHttpMetadata;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="PropertyWireInformation"/> class.
        /// </summary>
        /// <param name="inputProperty">The input model property.</param>
        internal PropertyWireInformation(InputProperty inputProperty)
            : base(CodeModelGenerator.Instance.TypeFactory.GetSerializationFormat(inputProperty.Type), inputProperty.SerializedName)
        // TODO -- this is only temporary because we do not support other type of serialization, improvement tracking https://github.com/microsoft/typespec/issues/5861
        {
            InputModelProperty? modelProperty = inputProperty as InputModelProperty;
            IsRequired = inputProperty.IsRequired;
            IsReadOnly = inputProperty.IsReadOnly;
            IsHttpMetadata = modelProperty != null && modelProperty.IsHttpMetadata;
            IsNullable = inputProperty.Type is InputNullableType;
            IsDiscriminator = modelProperty != null && modelProperty.IsDiscriminator;
        }
    }
}
