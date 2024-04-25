// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record StreamExpression(ValueExpression Untyped) : TypedValueExpression<Stream>(Untyped)
    {
        internal MethodBodyStatement CopyTo(StreamExpression destination) => new InvokeInstanceMethodStatement(Untyped, nameof(Stream.CopyTo), destination);

        internal ValueExpression Position => new TypedMemberExpression(this, nameof(Stream.Position), typeof(long));
    }
}
