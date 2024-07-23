// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp.Primitives
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
            : base(CodeModelPlugin.Instance.TypeFactory.GetSerializationFormat(inputModelProperty.Type), inputModelProperty.SerializedName)
        {
            IsRequired = inputModelProperty.IsRequired;
            IsReadOnly = inputModelProperty.IsReadOnly;
            IsNullable = inputModelProperty.Type is InputNullableType;
            IsDiscriminator = inputModelProperty.IsDiscriminator;
        }
    }
}
