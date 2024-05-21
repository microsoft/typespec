// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Snippets
{
    public static partial class Snippet
    {
        public class Optional
        {
            public static BoolSnippet IsCollectionDefined(TypedSnippet collection)
            {
                return OptionalProvider.Instance.IsCollectionDefined(collection);
            }

            public static BoolSnippet IsDefined(TypedSnippet value)
            {
                return OptionalProvider.Instance.IsDefined(value);
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
}
