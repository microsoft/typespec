// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputGenericType : InputType
    {
        public InputGenericType(Type type, InputType argumentType, bool isNullable) : base(type.Name, isNullable)
        {
            Type = type;
            ArgumentType = argumentType;
        }

        public Type Type { get; }
        public InputType ArgumentType { get; }
    }
}
