// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text.Json;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Snippets
{
    public static partial class Snippet
    {
        public static class New
        {
            public static ValueExpression ArgumentOutOfRangeException(TypeProvider provider, ParameterProvider valueParameter)
            {
                Debug.Assert(provider.IsEnum);
                return Instance(typeof(ArgumentOutOfRangeException), Nameof(valueParameter), valueParameter, Literal($"Unknown {provider.Name} value."));
            }
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
            public static IndexableExpression Array(CSharpType? elementType, bool isInline, bool isStackAlloc, params ValueExpression[] items) => new(new NewArrayExpression(elementType, new ArrayInitializerExpression(items, isInline), IsStackAlloc: isStackAlloc));
            public static IndexableExpression Array(CSharpType? elementType, ValueExpression size) => new(new NewArrayExpression(elementType, Size: size));

            public static DictionaryExpression ReadOnlyDictionary(CSharpType keyType, CSharpType valueType, params ValueExpression[] items)
                => new(new NewInstanceExpression(new CSharpType(typeof(System.Collections.ObjectModel.ReadOnlyDictionary<,>), keyType, valueType), items));
            public static DictionaryExpression Dictionary(CSharpType keyType, CSharpType valueType)
                => new(new NewInstanceExpression(new CSharpType(typeof(Dictionary<,>), keyType, valueType), []));
            public static DictionaryExpression Dictionary(CSharpType keyType, CSharpType valueType, IReadOnlyDictionary<ValueExpression, ValueExpression> values)
                => new(new NewInstanceExpression(new CSharpType(typeof(Dictionary<,>), keyType, valueType), [], new DictionaryInitializerExpression(values)));

            public static ScopedApi<List<T>> List<T>() => Instance(typeof(List<T>)).As<List<T>>();
            public static ScopedApi List(CSharpType elementType) => Instance(new CSharpType(typeof(List<>), elementType)).As(new CSharpType(typeof(List<>), elementType));

            public static ScopedApi<StreamReader> StreamReader(ValueExpression stream) => Instance(typeof(StreamReader), stream).As<StreamReader>();

            public static ScopedApi<TimeSpan> TimeSpan(int hours, int minutes, int seconds) => Instance(typeof(TimeSpan), Int(hours), Int(minutes), Int(seconds)).As<TimeSpan>();

            public static ValueExpression Anonymous(ValueExpression key, ValueExpression value) => Anonymous(new Dictionary<ValueExpression, ValueExpression> { [key] = value });
            public static ValueExpression Anonymous(IReadOnlyDictionary<ValueExpression, ValueExpression> properties) => new NewInstanceExpression(null, [], new ObjectInitializerExpression(properties));
            public static ValueExpression Instance(ConstructorSignature ctorSignature, IReadOnlyList<ValueExpression> arguments, IReadOnlyDictionary<ValueExpression, ValueExpression>? properties = null) => new NewInstanceExpression(ctorSignature.Type, arguments, properties != null ? new ObjectInitializerExpression(properties) : null);
            public static ValueExpression Instance(ConstructorSignature ctorSignature, IReadOnlyDictionary<ValueExpression, ValueExpression>? properties = null) => Instance(ctorSignature, ctorSignature.Parameters.Select(p => (ValueExpression)p).ToArray(), properties);
            public static ValueExpression Instance(CSharpType type, IReadOnlyList<ValueExpression> arguments) => new NewInstanceExpression(type, arguments);
            public static ValueExpression Instance(CSharpType type, params ValueExpression[] arguments) => new NewInstanceExpression(type, arguments);
            public static ValueExpression Instance(CSharpType type, IReadOnlyDictionary<ValueExpression, ValueExpression> properties) => new NewInstanceExpression(type, [], new ObjectInitializerExpression(properties));
            public static ScopedApi Instance(Type type, params ValueExpression[] arguments) => new NewInstanceExpression(type, arguments).As(type);
            public static ScopedApi Instance(Type type, IReadOnlyDictionary<ValueExpression, ValueExpression> properties) => new NewInstanceExpression(type, [], new ObjectInitializerExpression(properties)).As(type);
            public static ScopedApi<T> Instance<T>(IEnumerable<ValueExpression> arguments, IReadOnlyDictionary<ValueExpression, ValueExpression> properties)
                => new NewInstanceExpression(TypeReferenceExpression.GetTypeFromDefinition(typeof(T)), [.. arguments], new ObjectInitializerExpression(properties)).As<T>();
            public static ScopedApi<T> Instance<T>(params ValueExpression[] arguments)
                => new NewInstanceExpression(TypeReferenceExpression.GetTypeFromDefinition(typeof(T)), arguments).As<T>();
        }
    }
}
