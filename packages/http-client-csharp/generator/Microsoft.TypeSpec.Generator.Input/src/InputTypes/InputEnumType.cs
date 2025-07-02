// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{    /// <summary>
    /// Represents enumtype information.
    /// </summary>
    /// <summary>

    /// Gets the inpu type.

    /// </summary>

    public class InputEnumType : InputType
    {
        // We always call the Values setter so we know the field will not be null.
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider adding the 'required' modifier or declaring as nullable.        /// <summary>
        /// Initializes a new instance of the <see cref="InputEnumType"/> class.
        /// </summary>
        public InputEnumType(string name, string @namespace, string crossLanguageDefinitionId, string? access, string? deprecation, string? summary, string? doc, InputModelTypeUsage usage, InputPrimitiveType valueType, IReadOnlyList<InputEnumTypeValue> values, bool isExtensible)
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider adding the 'required' modifier or declaring as nullable.
            : base(name)
        {
            Namespace = @namespace;
            CrossLanguageDefinitionId = crossLanguageDefinitionId;
            Access = access;
            Deprecation = deprecation;
            Summary = summary;
            Doc = doc;
            Usage = usage;
            ValueType = valueType;
            Values = values;
            IsExtensible = isExtensible;
        }        /// <summary>
        /// Gets the namespace.
        /// </summary>
        public string Namespace { get; internal set; }        /// <summary>
        /// Gets the crosslanguagedefinitio identifier.
        /// </summary>
        public string CrossLanguageDefinitionId { get; internal set; }        /// <summary>
        /// Gets the access.
        /// </summary>
        public string? Access { get; internal set; }        /// <summary>
        /// Gets the deprecation.
        /// </summary>
        public string? Deprecation { get; internal set; }        /// <summary>
        /// Gets the summary.
        /// </summary>
        public string? Summary { get; internal set; }        /// <summary>
        /// Gets the doc.
        /// </summary>
        public string? Doc { get; internal set; }        /// <summary>
        /// Gets the usage.
        /// </summary>
        public InputModelTypeUsage Usage { get; internal set; }        /// <summary>
        /// Gets the valu type.
        /// </summary>
        public InputPrimitiveType ValueType { get; internal set; }
        private IReadOnlyList<InputEnumTypeValue> _values;        /// <summary>
        /// Gets the values.
        /// </summary>
        public IReadOnlyList<InputEnumTypeValue> Values
        {
            get => _values;
            internal set
            {
                foreach (var enumValue in value)
                {
                    enumValue.EnumType = this;
                }
                _values = value;
            }
        }        /// <summary>
        /// Gets the isextensible.
        /// </summary>
        public bool IsExtensible { get; internal set; }
    }
}
