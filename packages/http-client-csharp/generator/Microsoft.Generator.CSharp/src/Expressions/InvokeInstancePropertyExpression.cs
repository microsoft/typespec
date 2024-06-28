// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record InvokeInstancePropertyExpression(ValueExpression InstanceReference, string PropertyName) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            InstanceReference.Write(writer);
            writer.AppendRaw(".");
            writer.AppendRaw(PropertyName);
        }

        private MethodBodyStatement? _terminated;
        public MethodBodyStatement Terminate() => _terminated ??= new ExpressionStatement(this);
    }
}
