// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using AutoRest.CSharp.Input;
using Azure.Core;

namespace AutoRest.CSharp.Utilities
{
    /// <summary>
    /// A read-only dictionary lazily populated on first access
    /// </summary>
    /// <typeparam name="K">Key</typeparam>
    /// <typeparam name="V">Value</typeparam>
    public class CachedDictionary<K, V> : IDictionary<K, V> where K : notnull where V : notnull
    {
        private Dictionary<K, V>? _values;
        private Func<Dictionary<K, V>> _populateProc;

        public CachedDictionary(Func<Dictionary<K, V>> populateProc)
        {
            _populateProc = populateProc;
        }

        public bool IsPopulated => _values != null;

        private Dictionary<K, V> EnsureValues() => _values ??= _populateProc();

        public int Count => EnsureValues().Count;
        public bool IsReadOnly => true;

        public bool Contains(KeyValuePair<K, V> item) => ((IDictionary)EnsureValues()).Contains(item);
        public bool ContainsKey(K key) => EnsureValues().ContainsKey(key);
        public bool TryGetValue(K key, [MaybeNullWhen(false)] out V value) => EnsureValues().TryGetValue(key, out value);
        public void CopyTo(KeyValuePair<K, V>[] array, int arrayIndex) => ((IDictionary)EnsureValues()).CopyTo(array, arrayIndex);

        public ICollection<K> Keys => EnsureValues().Keys;
        public ICollection<V> Values => EnsureValues().Values;

        public V this[K key] => EnsureValues()[key];

        V IDictionary<K, V>.this[K key]
        {
            get => this[key];
            set => throw new NotSupportedException("Read Only");
        }

        void IDictionary<K, V>.Add(K key, V value) => throw new NotSupportedException("Read Only");
        bool IDictionary<K, V>.Remove(K key) => throw new NotSupportedException("Read Only");
        void ICollection<KeyValuePair<K, V>>.Add(KeyValuePair<K, V> item) => throw new NotSupportedException("Read Only");
        void ICollection<KeyValuePair<K, V>>.Clear() => throw new NotSupportedException("Read Only");
        bool ICollection<KeyValuePair<K, V>>.Remove(KeyValuePair<K, V> item) => throw new NotSupportedException("Read Only");

        public IEnumerator<KeyValuePair<K, V>> GetEnumerator() => EnsureValues().GetEnumerator();
        IEnumerator IEnumerable.GetEnumerator() => this.GetEnumerator();
    }
}
