// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal sealed record OptionalSnippet(ValueExpression Expression) : TypedSnippet<SystemOptionalProvider>(Expression)
    {
        private const string IsDefinedMethodName = "IsDefined";
        private const string IsCollectionDefinedMethodName = "IsCollectionDefined";

        public static ScopedApi<bool> IsCollectionDefined(ValueExpression collection)
        {
            return Static<OptionalDefinition>().Invoke(IsCollectionDefinedMethodName, [collection]).As<bool>();
        }

        public static ScopedApi<bool> IsDefined(ValueExpression value)
        {
            return Static<OptionalDefinition>().Invoke(IsDefinedMethodName, [value]).As<bool>();
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
