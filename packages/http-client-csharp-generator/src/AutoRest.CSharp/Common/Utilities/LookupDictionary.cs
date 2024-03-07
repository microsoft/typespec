// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Text;

namespace AutoRest.CSharp.Common.Utilities
{
    /// <summary>
    /// A dictionary that supports an alternative key type as secondary key.
    /// This dictionary maintains two dictionaries inside one with the primary key, and the other with the alternative key.
    /// The values inside them are the same.
    /// The dictionary with secondary keys is read-only
    /// </summary>
    /// <typeparam name="TKey">The primary key type</typeparam>
    /// <typeparam name="TAlterKey">The secondary key type</typeparam>
    /// <typeparam name="TValue">The value type</typeparam>
    public class LookupDictionary<TKey, TAlterKey, TValue> : IDictionary<TKey, TValue> where TKey : notnull where TAlterKey : notnull
    {
        private Dictionary<TKey, TValue> _values;
        private Dictionary<TAlterKey, TValue> _valuesAlter;
        private Func<TKey, TAlterKey> _convertFunc;

        public LookupDictionary(Func<TKey, TAlterKey> convertFunc)
        {
            _convertFunc = convertFunc;
            _values = new Dictionary<TKey, TValue>();
            _valuesAlter = new Dictionary<TAlterKey, TValue>();
        }

        public static implicit operator Dictionary<TKey, TValue>(LookupDictionary<TKey, TAlterKey, TValue> dict) => dict._values;

        public static implicit operator Dictionary<TAlterKey, TValue>(LookupDictionary<TKey, TAlterKey, TValue> dict) => dict._valuesAlter;

        private TAlterKey Convert(TKey key) => _convertFunc(key);

        public TValue this[TKey key]
        {
            get => _values[key];
            set
            {
                _values[key] = value;
                _valuesAlter[Convert(key)] = value;
            }
        }

        public TValue this[TAlterKey alterKey]
        {
            get => _valuesAlter[alterKey];
        }

        public ICollection<TKey> Keys => _values.Keys;

        public ICollection<TValue> Values => _values.Values;

        public int Count => _values.Count;

        public bool IsReadOnly => false;

        public void Add(TKey key, TValue value)
        {
            _values.Add(key, value);
            _valuesAlter.Add(Convert(key), value);
        }

        public void Clear() => _values.Clear();

        public bool ContainsKey(TKey key) => _values.ContainsKey(key);

        public bool ContainsKey(TAlterKey alterKey) => _valuesAlter.ContainsKey(alterKey);

        public IEnumerator<KeyValuePair<TKey, TValue>> GetEnumerator() => _values.GetEnumerator();

        public bool Remove(TKey key)
        {
            _valuesAlter.Remove(Convert(key));
            return _values.Remove(key);
        }

        public bool TryGetValue(TKey key, [MaybeNullWhen(false)] out TValue value) => _values.TryGetValue(key, out value);

        public bool TryGetValue(TAlterKey alterKey, [MaybeNullWhen(false)] out TValue value) => _valuesAlter.TryGetValue(alterKey, out value);

        IEnumerator IEnumerable.GetEnumerator()
        {
            return _values.GetEnumerator();
        }

        public void CopyTo(KeyValuePair<TKey, TValue>[] array, int arrayIndex) => ((IDictionary)_values).CopyTo(array, arrayIndex);

        void ICollection<KeyValuePair<TKey, TValue>>.Add(KeyValuePair<TKey, TValue> item)
        {
            throw new NotImplementedException();
        }

        bool ICollection<KeyValuePair<TKey, TValue>>.Contains(KeyValuePair<TKey, TValue> item)
        {
            throw new NotImplementedException();
        }

        bool ICollection<KeyValuePair<TKey, TValue>>.Remove(KeyValuePair<TKey, TValue> item)
        {
            throw new NotImplementedException();
        }
    }
}
