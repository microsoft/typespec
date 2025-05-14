// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    public sealed class InputLiteralType : InputType
    {
        public InputLiteralType(string name, string @namespace, InputPrimitiveType valueType, object value) : base(name)
        {
            Namespace = @namespace;
            ValueType = valueType;
            Value = value;
        }

        public string Namespace { get; }
        public InputPrimitiveType ValueType { get; }
        public object Value { get; }

        public static implicit operator InputConstant(InputLiteralType literal) => new(literal.Value, literal.ValueType);
    }
}
