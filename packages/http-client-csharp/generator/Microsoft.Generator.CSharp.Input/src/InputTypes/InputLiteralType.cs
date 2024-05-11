// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    public sealed class InputLiteralType : InputType
    {
        public InputLiteralType(string name, InputType literalValueType, object value, bool isNullable) : base(name, isNullable)
        {
            LiteralValueType = literalValueType;
            Value = value;
        }

        public InputType LiteralValueType { get; }
        public object Value { get; }
    }
}
