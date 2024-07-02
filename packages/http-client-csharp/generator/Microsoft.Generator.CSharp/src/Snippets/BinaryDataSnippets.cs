// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Snippets
{
    public static class BinaryDataSnippets
    {
        public static ScopedApi ToObjectFromJson(this ScopedApi<BinaryData> binaryData, Type responseType)
            => binaryData.Invoke(nameof(BinaryData.ToObjectFromJson), [], [new CSharpType(responseType)], false).As(responseType);

        public static ListSnippet ToArray(this ScopedApi<BinaryData> binaryData) => new(typeof(byte[]), binaryData.Invoke(nameof(BinaryData.ToArray)));

        public static ScopedApi<BinaryData> FromStream(ValueExpression stream, bool async)
        {
            var methodName = async ? nameof(BinaryData.FromStreamAsync) : nameof(BinaryData.FromStream);
            return Static<BinaryData>().Invoke(methodName, [stream], null, callAsAsync: async).As<BinaryData>();
        }

        public static ValueExpression ToMemory(this ScopedApi<BinaryData> binaryData) => binaryData.Invoke(nameof(BinaryData.ToMemory));

        public static StreamSnippet ToStream(this ScopedApi<BinaryData> binaryData) => new(binaryData.Invoke(nameof(BinaryData.ToStream)));

        public static ScopedApi<BinaryData> FromBytes(ValueExpression data)
            => Static<BinaryData>().Invoke(nameof(BinaryData.FromBytes), data).As<BinaryData>();

        public static ScopedApi<BinaryData> FromObjectAsJson(ValueExpression data)
            => Static<BinaryData>().Invoke(nameof(BinaryData.FromObjectAsJson), data).As<BinaryData>();

        public static ScopedApi<BinaryData> FromString(ValueExpression data)
            => Static<BinaryData>().Invoke(nameof(BinaryData.FromString), data).As<BinaryData>();
    }
}
