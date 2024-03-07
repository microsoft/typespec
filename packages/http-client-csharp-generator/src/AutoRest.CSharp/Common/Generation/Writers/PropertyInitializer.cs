// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using AutoRest.CSharp.Generation.Types;

namespace AutoRest.CSharp.Generation.Writers
{
    internal readonly struct PropertyInitializer
    {
        public PropertyInitializer(string name, CSharpType type, bool isReadOnly, FormattableString value, CSharpType? valueType = null)
        {
            Name = name;
            Type = type;
            IsReadOnly = isReadOnly;
            Value = value;
            ValueType = valueType ?? type;
        }

        public string Name { get; }
        public CSharpType Type  { get; }
        public FormattableString Value { get; }
        public CSharpType ValueType { get; }
        public bool IsReadOnly { get; }
    }
}
