// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputEnumType : InputType
    {
        public InputEnumType(string name, string crossLanguageDefinitionId, string? accessibility, string? deprecated, string? summary, string? doc, InputModelTypeUsage usage, InputPrimitiveType valueType, IReadOnlyList<InputEnumTypeValue> values, bool isExtensible)
            : base(name)
        {
            CrossLanguageDefinitionId = crossLanguageDefinitionId;
            Accessibility = accessibility;
            Deprecated = deprecated;
            Summary = summary;
            Doc = doc;
            Usage = usage;
            ValueType = valueType;
            Values = values;
            IsExtensible = isExtensible;
        }

        public string CrossLanguageDefinitionId { get; }
        public string? Accessibility { get; }
        public string? Deprecated { get; }
        public string? Summary { get; }
        public string? Doc { get; }
        public InputModelTypeUsage Usage { get; }
        public InputPrimitiveType ValueType { get; }
        public IReadOnlyList<InputEnumTypeValue> Values { get; }
        public bool IsExtensible { get; }
    }
}
