// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections;
using System.Collections.Generic;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;

namespace AutoRest.CSharp.Common.Output.Expressions.Statements
{
    internal record UsingScopeStatement(CSharpType? Type, CodeWriterDeclaration Variable, ValueExpression Value) : MethodBodyStatement, IEnumerable<MethodBodyStatement>
    {
        private readonly List<MethodBodyStatement> _body = new();
        public IReadOnlyList<MethodBodyStatement> Body => _body;

        public UsingScopeStatement(CSharpType type, string variableName, ValueExpression value, out VariableReference variable) : this(type, new CodeWriterDeclaration(variableName), value)
        {
            variable = new VariableReference(type, Variable);
        }

        public void Add(MethodBodyStatement statement) => _body.Add(statement);
        public IEnumerator<MethodBodyStatement> GetEnumerator() => _body.GetEnumerator();
        IEnumerator IEnumerable.GetEnumerator() => ((IEnumerable)_body).GetEnumerator();
    }
}
