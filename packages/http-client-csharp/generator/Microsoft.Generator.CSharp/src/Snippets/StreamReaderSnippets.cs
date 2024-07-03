// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;

namespace Microsoft.Generator.CSharp.Snippets
{
    public static class StreamReaderSnippets
    {
        public static ScopedApi<string> ReadToEnd(this ScopedApi<StreamReader> srExpression, bool async)
        {
            var methodName = async ? nameof(StreamReader.ReadToEndAsync) : nameof(StreamReader.ReadToEnd);
            return srExpression.Invoke(methodName, [], async).As<string>();
        }
    }
}
