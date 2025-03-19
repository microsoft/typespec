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

        public PropertyWireInformation(SerializationFormat serializationFormat, bool isRequired, bool isReadOnly, bool isNullable, bool isDiscriminator, string serializedName)
            : base(serializationFormat, serializedName)
        {
            IsRequired = isRequired;
            IsReadOnly = isReadOnly;
            IsNullable = isNullable;
            IsDiscriminator = isDiscriminator;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="PropertyWireInformation"/> class.
        /// </summary>
        /// <param name="inputModelProperty">The input model property.</param>
        internal PropertyWireInformation(InputModelProperty inputModelProperty)
            : base(CodeModelGenerator.Instance.TypeFactory.GetSerializationFormat(inputModelProperty.Type), inputModelProperty.SerializedName)
        // TODO -- this is only temporary because we do not support other type of serialization, improvement tracking https://github.com/microsoft/typespec/issues/5861
        {
            IsRequired = inputModelProperty.IsRequired;
            IsReadOnly = inputModelProperty.IsReadOnly;
            IsNullable = inputModelProperty.Type is InputNullableType;
            IsDiscriminator = inputModelProperty.IsDiscriminator;
        }
    }
}
