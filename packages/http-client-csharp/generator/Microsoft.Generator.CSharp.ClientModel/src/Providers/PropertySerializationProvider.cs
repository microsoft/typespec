// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    /// <summary>
    /// Provides functionality for property serialization for a model.
    /// </summary>
    internal sealed class PropertySerializationProvider : PropertyProvider
    {
        public string VariableName { get; }
        public string SerializedName { get; }
        public SerializationFormat SerializationFormat { get; }
        public VariableReferenceSnippet VariableReference { get; }

        /// <summary>
        /// Initializes a new instance of the <see cref="PropertySerializationProvider"/> class.
        /// </summary>
        /// <param name="inputModelProperty">The model property to serialize.</param>
        public PropertySerializationProvider(InputModelProperty inputModelProperty) : base(inputModelProperty)
        {
            SerializedName = inputModelProperty.SerializedName;
            VariableName = Name.ToVariableName();
            SerializationFormat = ClientModelPlugin.Instance.TypeFactory.GetSerializationFormat(inputModelProperty.Type);
            VariableReference = new VariableReferenceSnippet(Type, SerializedName.ToVariableName());
        }
    }
}
