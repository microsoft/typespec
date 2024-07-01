// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record InvokeStaticPropertyExpression(CSharpType? ContainingType, string PropertyName, bool CallAsAsync = false) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            writer.AppendRawIf("await ", CallAsAsync);
            if (ContainingType != null)
            {
                writer.Append($"{ContainingType}.");
            }

            writer.AppendRaw(PropertyName);
            writer.AppendRawIf(".ConfigureAwait(false)", CallAsAsync);
        }

        private MethodBodyStatement? _terminated;
        public MethodBodyStatement Terminate() => _terminated ??= new ExpressionStatement(this);
    }
}
