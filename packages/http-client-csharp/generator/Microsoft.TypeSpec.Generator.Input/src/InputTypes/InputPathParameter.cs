// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{    /// <summary>
    /// Represents pathparameter information.
    /// </summary>
    /// <summary>

    /// Gets the inputproperty.

    /// </summary>

    public class InputPathParameter : InputProperty
    {        /// <summary>
        /// Initializes a new instance of the <see cref="InputPathParameter"/> class.
        /// </summary>
        public InputPathParameter(string name, string? summary, string? doc, InputType type, bool isRequired, bool isReadOnly, string? access, bool allowReserved, string serializedName) : base(name, summary, doc, type, isRequired, isReadOnly, access, serializedName)
        {
            Name = name;
            Summary = summary;
            Doc = doc;
            Type = type;
            IsRequired = isRequired;
            IsReadOnly = isReadOnly;
            AllowReserved = allowReserved;
        }        /// <summary>
        /// Gets the allowreserved.
        /// </summary>
        public bool AllowReserved { get; internal set; }
    }
}
