// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.IO;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions
{
    internal sealed record StreamExpression(ValueExpression Untyped) : TypedValueExpression<Stream>(Untyped)
    {
        public MethodBodyStatement CopyTo(StreamExpression destination) => new InvokeInstanceMethodStatement(Untyped, nameof(Stream.CopyTo), destination);

        public ValueExpression Position => new TypedMemberExpression(this, nameof(Stream.Position), typeof(long));
    }
}
