// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace AutoRest.CSharp.Common.Utilities
{

    internal static class DictionaryExtensions
    {
        public static void CreateAndCacheResult<TKey, TValue>(this IDictionary<TKey, Func<TValue>> cache, TKey key, Func<TValue> createValue) where TKey : notnull
        {
            if (cache.TryGetValue(key, out var createCache))
            {
                return;
            }

            TValue? value = default;
            createCache = () => value ??= createValue();
            cache[key] = createCache;
        }
    }
}
