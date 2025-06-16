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
        public PropertyLocation Location { get; }

        public PropertyWireInformation(SerializationFormat serializationFormat, bool isRequired, bool isReadOnly, bool isNullable, bool isDiscriminator, string serializedName, PropertyLocation location = PropertyLocation.Unknown)
            : base(serializationFormat, serializedName)
        {
            IsRequired = isRequired;
            IsReadOnly = isReadOnly;
            IsNullable = isNullable;
            IsDiscriminator = isDiscriminator;
            Location = location;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="PropertyWireInformation"/> class.
        /// </summary>
        /// <param name="inputProperty">The input model property.</param>
        internal PropertyWireInformation(InputProperty inputProperty)
            : base(CodeModelGenerator.Instance.TypeFactory.GetSerializationFormat(inputProperty.Type), inputProperty.SerializedName)
        // TODO -- this is only temporary because we do not support other type of serialization, improvement tracking https://github.com/microsoft/typespec/issues/5861
        {
            IsRequired = inputProperty.IsRequired;
            IsReadOnly = inputProperty.IsReadOnly;
            IsNullable = inputProperty.Type is InputNullableType;
            IsDiscriminator = inputProperty is InputModelProperty modelProperty && modelProperty.IsDiscriminator;
            Location = ToPropertyLocation(inputProperty);
        }

        private static PropertyLocation ToPropertyLocation(InputProperty inputProperty)
            => inputProperty switch
            {
                InputHeaderParameter => PropertyLocation.Header,
                InputModelProperty => PropertyLocation.Body,
                InputQueryParameter => PropertyLocation.Query,
                InputPathParameter => PropertyLocation.Path,
                _ => PropertyLocation.Unknown,
            };
    }
}
