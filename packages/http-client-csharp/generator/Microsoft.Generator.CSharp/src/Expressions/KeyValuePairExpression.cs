// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record KeyValuePairExpression(KeyValuePairType Type, ValueExpression Original)
        : ValueExpression(Original)
    {
        public CSharpType KeyType => Type.KeyType;
        public CSharpType ValueType => Type.ValueType;

        public ValueExpression Key => Property(nameof(KeyValuePair<object, object>.Key));

        public ValueExpression Value => Property(nameof(KeyValuePair<object, object>.Value));

        internal override void Write(CodeWriter writer)
        {
            Original.Write(writer);
        }
    }
}
