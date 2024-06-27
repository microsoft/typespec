// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal sealed record OptionalSnippet(ValueExpression Untyped) : TypedSnippet<SystemOptionalProvider>(Untyped)
    {
        private const string IsDefinedMethodName = "IsDefined";
        private const string IsCollectionDefinedMethodName = "IsCollectionDefined";

        private static SystemOptionalProvider? _optionalProvider;

        private static SystemOptionalProvider OptionalProvider => _optionalProvider ??= new();

        public static BoolSnippet IsCollectionDefined(TypedSnippet collection)
        {
            return new BoolSnippet(new InvokeStaticMethodExpression(OptionalProvider.Type, IsCollectionDefinedMethodName, [collection]));
        }

        public static BoolSnippet IsDefined(TypedSnippet value)
        {
            return new BoolSnippet(new InvokeStaticMethodExpression(OptionalProvider.Type, IsDefinedMethodName, [value]));
        }

        public static ValueExpression FallBackToChangeTrackingCollection(TypedSnippet collection, CSharpType? paramType)
        {
            if (!collection.Type.IsCollection || collection.Type.IsReadOnlyMemory)
            {
                return collection;
            }

            var changeTrackingType = collection.Type.Arguments.Count == 1
                ? ClientModelPlugin.Instance.TypeFactory.ListInitializationType.MakeGenericType(collection.Type.Arguments)
                : ClientModelPlugin.Instance.TypeFactory.DictionaryInitializationType.MakeGenericType(collection.Type.Arguments);
            return NullCoalescing(collection, New.Instance(changeTrackingType));
        }
    }
}
