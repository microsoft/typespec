// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections;
using System.Collections.Generic;
using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;

namespace AutoRest.CSharp.Common.Output.Expressions.Statements
{
    internal record IfStatement(BoolExpression Condition, bool Inline = false, bool AddBraces = true) : MethodBodyStatement, IEnumerable<MethodBodyStatement>
    {
        private readonly List<MethodBodyStatement> _body = new();
        public MethodBodyStatement Body => _body;

        public void Add(MethodBodyStatement statement) => _body.Add(statement);
        public IEnumerator<MethodBodyStatement> GetEnumerator() => _body.GetEnumerator();
        IEnumerator IEnumerable.GetEnumerator() => ((IEnumerable)_body).GetEnumerator();
    }
}
