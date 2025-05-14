// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputEnumTypeValue : InputType
    {
        public InputEnumTypeValue(string name, object value, InputPrimitiveType valueType, InputEnumType enumType, string? summary, string? doc) : base(name)
        {
            Name = name;
            Value = value;
            ValueType = valueType;
            EnumType = enumType;
            Summary = summary;
            Doc = doc;
        }

        public object Value { get; }
        public InputPrimitiveType ValueType { get; }
        public InputEnumType EnumType { get; }
        public string? Summary { get; }
        public string? Doc { get; }

        public virtual string GetJsonValueString() => GetValueString();
        public string GetValueString() => Value.ToString() ?? string.Empty;
    }
}
