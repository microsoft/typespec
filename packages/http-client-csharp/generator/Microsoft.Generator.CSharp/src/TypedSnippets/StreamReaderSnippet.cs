// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record StreamReaderSnippet(ValueExpression Untyped) : TypedSnippet<StreamReader>(Untyped)
    {
        public StringSnippet ReadToEnd(bool async)
        {
            var methodName = async ? nameof(StreamReader.ReadToEndAsync) : nameof(StreamReader.ReadToEnd);
            return new(Untyped.Invoke(methodName, Array.Empty<ValueExpression>(), async));
        }
    }
}
