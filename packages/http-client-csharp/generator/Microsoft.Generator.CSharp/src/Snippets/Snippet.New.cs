// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Snippets
{
    public static partial class Snippet
    {
        public static class New
        {
            public static ValueExpression ArgumentOutOfRangeException(EnumProvider enumType, ParameterProvider valueParameter)
                => Instance(typeof(ArgumentOutOfRangeException), Nameof(valueParameter), valueParameter, Literal($"Unknown {enumType.Name} value."));
            public static ValueExpression ArgumentOutOfRangeException(ValueExpression valueParameter, string message, bool wrapInNameOf = true)
                => Instance(typeof(ArgumentOutOfRangeException), wrapInNameOf ? Nameof(valueParameter) : valueParameter, Literal(message));

            public static ValueExpression NotImplementedException(ValueExpression message)
                => Instance(typeof(NotImplementedException), message);

            public static ValueExpression NotSupportedException(ValueExpression message)
                => Instance(typeof(NotSupportedException), message);

            public static ValueExpression InvalidOperationException(ValueExpression message)
                => Instance(typeof(InvalidOperationException), message);

            public static ValueExpression ArgumentNullException(ValueExpression parameter, bool wrapInNameOf = true)
                => Instance(typeof(ArgumentNullException), wrapInNameOf ? Nameof(parameter) : parameter);

            public static ValueExpression ArgumentException(ValueExpression parameter, string message, bool wrapInNameOf = true)
                => ArgumentException(parameter, Literal(message), wrapInNameOf);

            public static ValueExpression ArgumentException(ValueExpression parameter, ValueExpression message, bool wrapInNameOf = true)
                => Instance(typeof(ArgumentException), message, wrapInNameOf ? Nameof(parameter) : parameter);

            public static ValueExpression JsonException(ValueExpression message)
                => Instance(typeof(JsonException), message);

            public static IndexableExpression Array(CSharpType? elementType) => new(new NewArrayExpression(elementType));
            public static IndexableExpression Array(CSharpType? elementType, params ValueExpression[] items) => new(new NewArrayExpression(elementType, new ArrayInitializerExpression(items)));
            public static IndexableExpression Array(CSharpType? elementType, bool isInline, params ValueExpression[] items) => new(new NewArrayExpression(elementType, new ArrayInitializerExpression(items, isInline)));
            public static IndexableExpression Array(CSharpType? elementType, ValueExpression size) => new(new NewArrayExpression(elementType, Size: size));

            public static DictionarySnippet Dictionary(CSharpType keyType, CSharpType valueType)
                => new(keyType, valueType, new NewInstanceExpression(new CSharpType(typeof(Dictionary<,>), keyType, valueType), []));
            public static DictionarySnippet Dictionary(CSharpType keyType, CSharpType valueType, IReadOnlyDictionary<ValueExpression, ValueExpression> values)
                => new(keyType, valueType, new NewInstanceExpression(new CSharpType(typeof(Dictionary<,>), keyType, valueType), [], new DictionaryInitializerExpression(values)));

            public static TypedSnippet JsonSerializerOptions() => new FrameworkTypeSnippet(typeof(JsonSerializerOptions), new ValueExpression());

            public static ListSnippet List(CSharpType elementType) => new(elementType, Instance(new CSharpType(typeof(List<>), elementType)));

            public static StreamReaderSnippet StreamReader(ValueExpression stream) => new(Instance(typeof(StreamReader), stream));

            public static TimeSpanSnippet TimeSpan(int hours, int minutes, int seconds) => new(Instance(typeof(TimeSpan), Int(hours), Int(minutes), Int(seconds)));
            public static TypedSnippet Uri(string uri) => Instance(typeof(Uri), Literal(uri));

            public static ValueExpression Anonymous(ValueExpression key, ValueExpression value) => Anonymous(new Dictionary<ValueExpression, ValueExpression> { [key] = value });
            public static ValueExpression Anonymous(IReadOnlyDictionary<ValueExpression, ValueExpression> properties) => new NewInstanceExpression(null, [], new ObjectInitializerExpression(properties));
            public static ValueExpression Instance(ConstructorSignature ctorSignature, IReadOnlyList<ValueExpression> arguments, IReadOnlyDictionary<ValueExpression, ValueExpression>? properties = null) => new NewInstanceExpression(ctorSignature.Type, arguments, properties != null ? new ObjectInitializerExpression(properties) : null);
            public static ValueExpression Instance(ConstructorSignature ctorSignature, IReadOnlyDictionary<ValueExpression, ValueExpression>? properties = null) => Instance(ctorSignature, ctorSignature.Parameters.Select(p => (ValueExpression)p).ToArray(), properties);
            public static ValueExpression Instance(CSharpType type, IReadOnlyList<ValueExpression> arguments) => new NewInstanceExpression(type, arguments);
            public static ValueExpression Instance(CSharpType type, params ValueExpression[] arguments) => new NewInstanceExpression(type, arguments);
            public static ValueExpression Instance(CSharpType type, IReadOnlyDictionary<ValueExpression, ValueExpression> properties) => new NewInstanceExpression(type, System.Array.Empty<ValueExpression>(), new ObjectInitializerExpression(properties));
            public static TypedSnippet Instance(Type type, params ValueExpression[] arguments) => new FrameworkTypeSnippet(type, new NewInstanceExpression(type, arguments));
            public static TypedSnippet Instance(Type type, IReadOnlyDictionary<ValueExpression, ValueExpression> properties) => new FrameworkTypeSnippet(type, new NewInstanceExpression(type, System.Array.Empty<ValueExpression>(), new ObjectInitializerExpression(properties)));
        }
    }
}
