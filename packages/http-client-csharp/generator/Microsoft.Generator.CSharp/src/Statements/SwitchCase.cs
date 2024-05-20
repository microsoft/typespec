// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;


namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record SwitchCase(IReadOnlyList<ValueExpression> Match, MethodBodyStatement Statement, bool Inline = false, bool AddScope = false)
    {
        public SwitchCase(ValueExpression match, MethodBodyStatement statement, bool inline = false, bool addScope = false) : this(new[] { match }, statement, inline, addScope) { }

        public static SwitchCase Default(MethodBodyStatement statement, bool inline = false, bool addScope = false) => new(Array.Empty<ValueExpression>(), statement, inline, addScope);
    }
}
