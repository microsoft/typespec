// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record StreamReaderSnippet(ValueExpression Expression) : TypedSnippet<StreamReader>(Expression)
    {
        public StringSnippet ReadToEnd(bool async)
        {
            var methodName = async ? nameof(StreamReader.ReadToEndAsync) : nameof(StreamReader.ReadToEnd);
            return new(Expression.Invoke(methodName, Array.Empty<ValueExpression>(), async));
        }
    }
}
