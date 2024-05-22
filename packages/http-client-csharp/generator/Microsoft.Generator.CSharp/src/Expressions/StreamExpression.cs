// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record StreamExpression(ValueExpression Untyped) : TypedValueExpression<Stream>(Untyped), ITypedValueExpressionFactory<StreamExpression>
    {
        public MethodBodyStatement CopyTo(StreamExpression destination) => new InvokeInstanceMethodStatement(Untyped, nameof(Stream.CopyTo), destination);

        public LongExpression Position => new(new TypedMemberExpression(this, nameof(Stream.Position), typeof(long)));
        public ValueExpression GetBuffer => new InvokeInstanceMethodExpression(this, nameof(MemoryStream.GetBuffer), Array.Empty<ValueExpression>(), null, false);

        static StreamExpression ITypedValueExpressionFactory<StreamExpression>.Create(ValueExpression untyped)
            => new(untyped);
    }
}
