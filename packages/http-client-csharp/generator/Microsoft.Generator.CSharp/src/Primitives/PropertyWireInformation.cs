// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp.Primitives
{
    public class PropertyWireInformation
    {
        public SerializationFormat SerializationFormat { get; }
        public bool IsRequired { get; }
        public bool IsReadOnly { get; }
        public bool IsNullable { get; }
        public string SerializedName { get; }

        public PropertyWireInformation(SerializationFormat serializationFormat, bool isRequired, bool isReadOnly, bool isNullable, string serializedName)
        {
            SerializationFormat = serializationFormat;
            IsRequired = isRequired;
            IsReadOnly = isReadOnly;
            IsNullable = isNullable;
            SerializedName = serializedName;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="PropertyWireInformation"/> class.
        /// </summary>
        /// <param name="inputModelProperty">The input model property.</param>
        internal PropertyWireInformation(InputModelProperty inputModelProperty)
        {
            SerializationFormat = CodeModelPlugin.Instance.TypeFactory.GetSerializationFormat(inputModelProperty.Type);
            IsRequired = inputModelProperty.IsRequired;
            IsReadOnly = inputModelProperty.IsReadOnly;
            IsNullable = inputModelProperty.Type is InputNullableType;
            SerializedName = inputModelProperty.SerializedName.FirstCharToUpperCase();
        }
    }
}
