// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    public sealed class InputLiteralType : InputType
    {
        public InputLiteralType(InputType valueType, object value) : base("Literal")
        {
            ValueType = valueType;
            Value = value;
        }

        public InputType ValueType { get; }
        public object Value { get; }

        public static implicit operator InputConstant(InputLiteralType literal) => new(literal.Value, literal.ValueType);
    }
}
