// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputEnumTypeValue : InputType
    {
        // We only access these types from an InputEnumType and in the Values setter the owner is always set so we can safely assume they are not null.
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider adding the 'required' modifier or declaring as nullable.
        public InputEnumTypeValue(string name, object value, InputPrimitiveType valueType, string? summary, string? doc, InputEnumType? enumType = default) : base(name)
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider adding the 'required' modifier or declaring as nullable.
        {
            Name = name;
            Value = value;
            ValueType = valueType;
            // EnumType will be set when the value is applied to an enum type if this parameter is null
            if (enumType is not null)
            {
                EnumType = enumType;
            }
            Summary = summary;
            Doc = doc;
        }

        public object Value { get; }
        public InputPrimitiveType ValueType { get; }
        public InputEnumType EnumType { get; internal set; }
        public string? Summary { get; }
        public string? Doc { get; }

        public virtual string GetJsonValueString() => GetValueString();
        public string GetValueString() => Value.ToString() ?? string.Empty;
    }
}
