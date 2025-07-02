// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{    /// <summary>
    /// Represents headerparameter information.
    /// </summary>
    /// <summary>

    /// Gets the inputproperty.

    /// </summary>

    public class InputHeaderParameter : InputProperty
    {        /// <summary>
        /// Initializes a new instance of the <see cref="InputHeaderParameter"/> class.
        /// </summary>
        public InputHeaderParameter(string name, string? summary, string? doc, InputType type, bool isRequired, bool isReadOnly, string? access, string? collectionFormat, string serializedName) : base(name, summary, doc, type, isRequired, isReadOnly, access, serializedName)
        {
            Name = name;
            Summary = summary;
            Doc = doc;
            Type = type;
            IsRequired = isRequired;
            IsReadOnly = isReadOnly;
            CollectionFormat = collectionFormat;
            SerializedName = serializedName;
        }        /// <summary>
        /// Gets the collectionformat.
        /// </summary>
        public string? CollectionFormat { get; internal set; }
    }
}
