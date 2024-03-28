// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoRest.CSharp.Utilities;

namespace AutoRest.CSharp.Common.Utilities
{
    internal static class HashSetExtensions
    {
        /// <summary>
        /// Push an item into the set, which will be popped later when the returned <see cref="IDisposable"/> is disposed.
        /// </summary>
        /// <typeparam name="T"><see cref="HashSet{T}">HashSet</see> item</typeparam>
        /// <param name="hashSet"></param>
        /// <param name="item">Item to push</param>
        /// <returns></returns>
        internal static IDisposable Push<T>(this HashSet<T> hashSet, T item)
        {
            hashSet.Add(item);
            return Disposable.Create(() =>
            {
                hashSet.Remove(item);
            });
        }
    }
}
