// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record BinaryDataSnippet(ValueExpression Untyped) : TypedSnippet<BinaryData>(Untyped)
    {
        private static readonly CSharpType _binaryDataType = typeof(BinaryData);

        public FrameworkTypeSnippet ToObjectFromJson(Type responseType)
            => new(responseType, new InvokeInstanceMethodExpression(Untyped, nameof(BinaryData.ToObjectFromJson), Array.Empty<ValueExpression>(), new[] { new CSharpType(responseType) }, false));

        public static BinaryDataSnippet FromStream(StreamSnippet stream, bool async)
        {
            var methodName = async ? nameof(BinaryData.FromStreamAsync) : nameof(BinaryData.FromStream);
            return new BinaryDataSnippet(new InvokeStaticMethodExpression(_binaryDataType, methodName, stream, callAsAsync: async));
        }

        public static BinaryDataSnippet FromStream(ValueExpression stream, bool async)
        {
            var methodName = async ? nameof(BinaryData.FromStreamAsync) : nameof(BinaryData.FromStream);
            return new(new InvokeStaticMethodExpression(_binaryDataType, methodName, stream, callAsAsync: async));
        }

        public ValueExpression ToMemory() => Untyped.Invoke(nameof(BinaryData.ToMemory));

        public StreamSnippet ToStream() => new(Untyped.Invoke(nameof(BinaryData.ToStream)));

        public ListSnippet ToArray() => new(typeof(byte[]), Untyped.Invoke(nameof(BinaryData.ToArray)));

        public static BinaryDataSnippet FromBytes(ValueExpression data)
            => new(new InvokeStaticMethodExpression(_binaryDataType, nameof(BinaryData.FromBytes), data));

        public static BinaryDataSnippet FromObjectAsJson(ValueExpression data)
            => new(new InvokeStaticMethodExpression(_binaryDataType, nameof(BinaryData.FromObjectAsJson), data));

        public static BinaryDataSnippet FromString(ValueExpression data)
            => new(new InvokeStaticMethodExpression(_binaryDataType, nameof(BinaryData.FromString), data));

        //public static implicit operator ValueExpression(BinaryDataExpression binaryData)
        //    => binaryData.Untyped;
    }
}
