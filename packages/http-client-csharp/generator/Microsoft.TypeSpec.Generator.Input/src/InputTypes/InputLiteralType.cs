// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    public sealed class InputLiteralType : InputType
    {
        public InputLiteralType(string name, InputType valueType, object value) : base(name)
        {
            ValueType = valueType;
            Value = value;
        }

        public InputType ValueType { get; }
        public object Value { get; }

        public static implicit operator InputConstant(InputLiteralType literal) => new(literal.Value, literal.ValueType);
    }
}
