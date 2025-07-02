// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{    /// <summary>
    /// Represents bodyparameter information.
    /// </summary>
    /// <summary>

    /// Gets the inputproperty.

    /// </summary>

    public class InputBodyParameter : InputProperty
    {        /// <summary>
        /// Initializes a new instance of the <see cref="InputBodyParameter"/> class.
        /// </summary>
        public InputBodyParameter(string name, string? summary, string? doc, InputType type, bool isRequired, bool isReadOnly, string? access, string serializedName, IReadOnlyList<string> contentTypes, string defaultContentType) : base(name, summary, doc, type, isRequired, isReadOnly, access, serializedName)
        {
            Name = name;
            Summary = summary;
            Doc = doc;
            Type = type;
            IsRequired = isRequired;
            IsReadOnly = isReadOnly;
            SerializedName = serializedName;
            ContentTypes = contentTypes;
            DefaultContentType = defaultContentType;
        }        /// <summary>
        /// Gets the contenttypes.
        /// </summary>
        public IReadOnlyList<string> ContentTypes { get; internal set; }        /// <summary>
        /// Gets the defaultconten type.
        /// </summary>
        public string DefaultContentType { get; internal set; }
    }
}
