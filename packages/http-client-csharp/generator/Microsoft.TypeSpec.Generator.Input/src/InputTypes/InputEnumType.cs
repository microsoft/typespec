// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputEnumType : InputType
    {
        // We always call the Values setter so we know the field will not be null.
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider adding the 'required' modifier or declaring as nullable.
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
        }

        public string Namespace { get; internal set; }
        public string CrossLanguageDefinitionId { get; internal set; }
        public string? Access { get; internal set; }
        public string? Deprecation { get; internal set; }
        public string? Summary { get; internal set; }
        public string? Doc { get; internal set; }
        public InputModelTypeUsage Usage { get; internal set; }
        public InputPrimitiveType ValueType { get; internal set; }
        private IReadOnlyList<InputEnumTypeValue> _values;
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
        }
        public bool IsExtensible { get; internal set; }
    }
}
