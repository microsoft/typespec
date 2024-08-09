// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input
{
    public sealed class InputLiteralType : InputType
    {
        public InputLiteralType(InputType valueType, object value, IReadOnlyList<InputDecoratorInfo>? decorators = null) : base("Literal", decorators)
        {
            ValueType = valueType;
            Value = value;
        }

        public InputType ValueType { get; }
        public object Value { get; }

        public static implicit operator InputConstant(InputLiteralType literal) => new(literal.Value, literal.ValueType);
    }
}
