// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    // Never invoke arbitrary IReadOnlyList indexers/enumerators or lazy builders during metadata capture.
    internal static class ContractCollections
    {
        internal static bool TryCopy<T>(IReadOnlyList<T>? list, out ImmutableArray<T> items)
        {
            if (list is T[] array)
            {
                items = ImmutableArray.CreateRange(array);
                return true;
            }
            if (list is List<T> values && list.GetType() == typeof(List<T>))
            {
                items = ImmutableArray.CreateRange(values);
                return true;
            }
            if (list is ImmutableArray<T> immutable && !immutable.IsDefault)
            {
                items = immutable;
                return true;
            }
            items = [];
            return false;
        }

        internal static bool SameReferences<T>(IReadOnlyList<T>? list, ImmutableArray<T> snapshot) where T : class =>
            TryCopy(list, out var current) && current.Length == snapshot.Length &&
            current.Select((item, index) => ReferenceEquals(item, snapshot[index])).All(same => same);
    }
}
