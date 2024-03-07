// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;

namespace AutoRest.CSharp.Utilities
{
    internal static class EnumerableExtensions
    {
        public static IEnumerable<TSource> WhereNotNull<TSource>(this IEnumerable<TSource?> source)
        {
            foreach (var element in source)
            {
                if (element != null)
                {
                    yield return element;
                }
            }
        }

        //https://stackoverflow.com/a/58600254/294804
        public static void ForEachLast<T>(this IEnumerable<T> collection, Action<T>? actionExceptLast = null, Action<T>? actionOnLast = null) =>
            // ReSharper disable once IteratorMethodResultIsIgnored
            collection.SelectLast(i => { actionExceptLast?.Invoke(i); return true; }, i => { actionOnLast?.Invoke(i); return true; }).ToArray();

        public static IEnumerable<TResult> SelectLast<T, TResult>(this IEnumerable<T> collection, Func<T, TResult>? selectorExceptLast = null, Func<T, TResult>? selectorOnLast = null)
        {
            using var enumerator = collection.GetEnumerator();
            var isNotLast = enumerator.MoveNext();
            while (isNotLast)
            {
                var current = enumerator.Current;
                isNotLast = enumerator.MoveNext();
                var selector = isNotLast ? selectorExceptLast : selectorOnLast;
                //https://stackoverflow.com/a/32580613/294804
                if (selector != null)
                {
                    yield return selector.Invoke(current);
                }
            }
        }

        //https://stackoverflow.com/a/58755692/294804
        public static List<T> ToRecursiveOrderList<T>(this IEnumerable<T> collection, Expression<Func<T, IEnumerable<T>>> childCollection)
        {
            var resultList = new List<T>();
            var currentItems = new Queue<(int Index, T Item, int Depth)>(collection.Select(i => (0, i, 0)));
            var depthItemCounter = 0;
            var previousItemDepth = 0;
            var childProperty = (PropertyInfo)((MemberExpression)childCollection.Body).Member;
            while (currentItems.Count > 0)
            {
                var currentItem = currentItems.Dequeue();
                // Reset counter for number of items at this depth when the depth changes.
                if (currentItem.Depth != previousItemDepth) depthItemCounter = 0;
                var resultIndex = currentItem.Index + depthItemCounter++;
                resultList.Insert(resultIndex, currentItem.Item);

                var childItems = childProperty.GetValue(currentItem.Item) as IEnumerable<T> ?? Enumerable.Empty<T>();
                foreach (var childItem in childItems)
                {
                    currentItems.Enqueue((resultIndex + 1, childItem, currentItem.Depth + 1));
                }
                previousItemDepth = currentItem.Depth;
            }

            return resultList;
        }

        [return: MaybeNull]
        public static TValue GetValue<TValue>(this IDictionary<string, object>? dictionary, string key) =>
            ((dictionary?.ContainsKey(key) ?? false) && dictionary![key] is TValue item) ? item : default;

        [return: MaybeNull]
        public static T GetValue<T>(this IDictionary<object, object>? dictionary, string key) =>
            ((dictionary?.ContainsKey(key) ?? false) && dictionary![key] is T item) ? item : default;

        public static void AddInList<TKey, TValue, TList>(this Dictionary<TKey, TList> dictionary, TKey key, TValue value, Func<TList>? collectionConstructor = null) where TKey : notnull where TList : ICollection<TValue>, new()
        {
            if (dictionary.TryGetValue(key, out var list))
            {
                list.Add(value);
            }
            else
            {
                TList newList;
                if (collectionConstructor == null)
                    newList = new TList();
                else
                    newList = collectionConstructor();
                newList.Add(value);
                dictionary.Add(key, newList);
            }
        }
    }
}
