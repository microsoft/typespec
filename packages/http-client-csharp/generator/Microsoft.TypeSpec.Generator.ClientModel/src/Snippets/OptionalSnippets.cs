// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal static class OptionalSnippets
    {
        private const string IsDefinedMethodName = "IsDefined";
        private const string IsCollectionDefinedMethodName = "IsCollectionDefined";

        public static ScopedApi<bool> IsCollectionDefined(ValueExpression collection)
        {
            return Static<OptionalDefinition>().Invoke(IsCollectionDefinedMethodName, [collection]).As<bool>();
        }

        internal static ScopedApi<bool> IsCollectionDefined(ValueExpression collection, CSharpType collectionType)
        {
            // Concrete collection types cannot track an undefined state, so null represents an undefined collection.
            return IsConcreteCollection(collectionType)
                ? collection.NotEqual(Null)
                : IsCollectionDefined(collection);
        }

        internal static bool IsConcreteCollection(CSharpType type)
            => type is { IsCollection: true, IsReadOnlyMemory: false } && !type.FrameworkType.IsInterface;

        public static ScopedApi<bool> IsDefined(ValueExpression value)
        {
            return Static<OptionalDefinition>().Invoke(IsDefinedMethodName, [value]).As<bool>();
        }

        public static ScopedApi<bool> IsDefined(ValueExpression value, ValueExpression isDefined)
        {
            return Static<OptionalDefinition>().Invoke(IsDefinedMethodName, [value, isDefined]).As<bool>();
        }

        public static ValueExpression FallBackToChangeTrackingCollection(VariableExpression collection, CSharpType? paramType)
        {
            if (!collection.Type.IsCollection || collection.Type.IsReadOnlyMemory)
            {
                return collection;
            }

            if (IsConcreteCollection(collection.Type))
            {
                return collection.NullCoalesce(New.Instance(collection.Type));
            }

            var changeTrackingType = collection.Type.Arguments.Count == 1
                ? ScmCodeModelGenerator.Instance.TypeFactory.ListInitializationType.MakeGenericType(collection.Type.Arguments)
                : ScmCodeModelGenerator.Instance.TypeFactory.DictionaryInitializationType.MakeGenericType(collection.Type.Arguments);
            return collection.NullCoalesce(New.Instance(changeTrackingType));
        }
    }
}
