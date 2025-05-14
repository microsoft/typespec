// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputEnumType : InputType
    {
        public InputEnumType(string name, string @namespace, string crossLanguageDefinitionId, string? access, string? deprecation, string? summary, string? doc, InputModelTypeUsage usage, InputPrimitiveType valueType, IReadOnlyList<InputEnumTypeValue> values, bool isExtensible)
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
        public IReadOnlyList<InputEnumTypeValue> Values { get; internal set; }
        public bool IsExtensible { get; internal set; }
    }
}
