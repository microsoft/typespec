// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal sealed record OptionalSnippet(ValueExpression Untyped) : TypedSnippet<SystemOptionalProvider>(Untyped)
    {
        private static SystemOptionalProvider? _provider;
        private static SystemOptionalProvider Provider => _provider ??= new();
        public static BoolSnippet IsCollectionDefined(TypedSnippet collection)
        {
            return new BoolSnippet(new InvokeStaticMethodExpression(Provider.Type, "IsCollectionDefined", [collection]));
        }

        public static BoolSnippet IsDefined(TypedSnippet value)
        {
            return new BoolSnippet(new InvokeStaticMethodExpression(Provider.Type, "IsDefined", [value]));
        }

        public static ValueExpression FallBackToChangeTrackingCollection(TypedSnippet collection, CSharpType? paramType)
        {
            if (!collection.Type.IsCollection || collection.Type.IsReadOnlyMemory)
            {
                return collection;
            }

            var changeTrackingType = collection.Type.Arguments.Count == 1
                ? ChangeTrackingListProvider.Instance.Type.MakeGenericType(collection.Type.Arguments)
                : ChangeTrackingDictionaryProvider.Instance.Type.MakeGenericType(collection.Type.Arguments);
            return NullCoalescing(collection, New.Instance(changeTrackingType));
        }
    }
}
