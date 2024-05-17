// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record StreamReaderExpression(ValueExpression Untyped) : TypedValueExpression<StreamReader>(Untyped)
    {
        public StringExpression ReadToEnd(bool async)
        {
            var methodName = async ? nameof(StreamReader.ReadToEndAsync) : nameof(StreamReader.ReadToEnd);
            return new(Invoke(methodName, Array.Empty<ValueExpression>(), async));
        }
    }
}
