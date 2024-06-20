// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp.Providers
{
    public class PropertySerializationProvider
    {
        public SerializationFormat SerializationFormat { get; }
        public bool IsRequired { get; }
        public bool IsReadOnly { get; }
        public string SerializedName { get; }

        public PropertySerializationProvider(SerializationFormat serializationFormat, bool isRequired, bool isReadOnly, string serializedName)
        {
            SerializationFormat = serializationFormat;
            IsRequired = isRequired;
            IsReadOnly = isReadOnly;
            SerializedName = serializedName;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="PropertySerializationProvider"/> class.
        /// </summary>
        /// <param name="inputModelProperty">The input model property.</param>
        internal PropertySerializationProvider(InputModelProperty inputModelProperty)
        {
            SerializationFormat = CodeModelPlugin.Instance.TypeFactory.GetSerializationFormat(inputModelProperty.Type);
            IsRequired = inputModelProperty.IsRequired;
            IsReadOnly = inputModelProperty.IsReadOnly;
            SerializedName = inputModelProperty.SerializedName;
        }
    }
}
