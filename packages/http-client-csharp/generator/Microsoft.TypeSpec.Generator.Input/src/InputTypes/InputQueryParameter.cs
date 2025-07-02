// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{    /// <summary>
    /// Represents queryparameter information.
    /// </summary>
    /// <summary>

    /// Gets the inputproperty.

    /// </summary>

    public class InputQueryParameter : InputProperty
    {        /// <summary>
        /// Initializes a new instance of the <see cref="InputQueryParameter"/> class.
        /// </summary>
        public InputQueryParameter(string name, string? summary, string? doc, InputType type, bool isRequired, bool isReadOnly, string? access, string serializedName, string? collectionFormat, bool explode) : base(name, summary, doc, type, isRequired, isReadOnly, access, serializedName)
        {
            Name = name;
            Summary = summary;
            Doc = doc;
            Type = type;
            IsRequired = isRequired;
            IsReadOnly = isReadOnly;
            CollectionFormat = collectionFormat;
            SerializedName = serializedName;
            Explode = explode;
        }        /// <summary>
        /// Gets the collectionformat.
        /// </summary>
        public string? CollectionFormat { get; internal set; }        /// <summary>
        /// Gets the explode.
        /// </summary>
        public bool Explode { get; internal set; }
    }
}
