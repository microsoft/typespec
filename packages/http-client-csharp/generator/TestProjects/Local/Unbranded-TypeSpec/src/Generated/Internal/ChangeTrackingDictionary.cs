// <auto-generated/>

#nullable disable

using System;
using System.Collections;
using System.Collections.Generic;

namespace UnbrandedTypeSpec
{
    internal partial class ChangeTrackingDictionary<TKey, TValue> : IDictionary<TKey, TValue>, IReadOnlyDictionary<TKey, TValue> where TKey : notnull
    {
        private IDictionary<TKey, TValue> _innerDictionary;

        public ChangeTrackingDictionary()
        {
        }

        /// <param name="dictionary"> The inner dictionary. </param>
        public ChangeTrackingDictionary(IDictionary<TKey, TValue> dictionary)
        {
            if (dictionary == null)
            {
                return;
            }
            _innerDictionary = new Dictionary<TKey, TValue>(dictionary);
        }

        /// <param name="dictionary"> The inner dictionary. </param>
        public ChangeTrackingDictionary(IReadOnlyDictionary<TKey, TValue> dictionary)
        {
            if (dictionary == null)
            {
                return;
            }
            _innerDictionary = new Dictionary<TKey, TValue>();
            foreach (var pair in dictionary)
            {
                _innerDictionary.Add(pair);
            }
        }

        /// <summary> Gets the isundefined. </summary>
        public bool IsUndefined => _innerDictionary == null;

        /// <summary> Gets the count. </summary>
        public int Count => IsUndefined ? 0 : EnsureDictionary().Count;

        /// <summary> Gets the IsReadOnly. </summary>
        public bool IsReadOnly => IsUndefined ? false : EnsureDictionary().IsReadOnly;

        /// <summary> Gets the keys. </summary>
        public ICollection<TKey> Keys => IsUndefined ? Array.Empty<TKey>() : EnsureDictionary().Keys;

        /// <summary> Gets the values. </summary>
        public ICollection<TValue> Values => IsUndefined ? Array.Empty<TValue>() : EnsureDictionary().Values;

        /// <summary> Gets or sets the this. </summary>
        public TValue this[TKey key]
        {
            get
            {
                if (IsUndefined)
                {
                    throw new KeyNotFoundException(nameof(key));
                }
                return EnsureDictionary()[key];
            }
            set
            {
                EnsureDictionary()[key] = value;
            }
        }

        /// <summary> Gets the keys. </summary>
        IEnumerable<TKey> IReadOnlyDictionary<TKey, TValue>.Keys => Keys;

        /// <summary> Gets the values. </summary>
        IEnumerable<TValue> IReadOnlyDictionary<TKey, TValue>.Values => Values;

        public IEnumerator<KeyValuePair<TKey, TValue>> GetEnumerator()
        {
            if (IsUndefined)
            {
                IEnumerator<KeyValuePair<TKey, TValue>> enumerateEmpty()
                {
                    yield break;
                }
                return enumerateEmpty();
            }
            return EnsureDictionary().GetEnumerator();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }

        /// <param name="item"> The item to add. </param>
        public void Add(KeyValuePair<TKey, TValue> item)
        {
            EnsureDictionary().Add(item);
        }

        public void Clear()
        {
            EnsureDictionary().Clear();
        }

        /// <param name="item"> The item to search for. </param>
        public bool Contains(KeyValuePair<TKey, TValue> item)
        {
            if (IsUndefined)
            {
                return false;
            }
            return EnsureDictionary().Contains(item);
        }

        /// <param name="array"> The array to copy. </param>
        /// <param name="index"> The index. </param>
        public void CopyTo(KeyValuePair<TKey, TValue>[] array, int index)
        {
            if (IsUndefined)
            {
                return;
            }
            EnsureDictionary().CopyTo(array, index);
        }

        /// <param name="item"> The item to remove. </param>
        public bool Remove(KeyValuePair<TKey, TValue> item)
        {
            if (IsUndefined)
            {
                return false;
            }
            return EnsureDictionary().Remove(item);
        }

        /// <param name="key"> The key. </param>
        /// <param name="value"> The value to add. </param>
        public void Add(TKey key, TValue value)
        {
            EnsureDictionary().Add(key, value);
        }

        /// <param name="key"> The key to search for. </param>
        public bool ContainsKey(TKey key)
        {
            if (IsUndefined)
            {
                return false;
            }
            return EnsureDictionary().ContainsKey(key);
        }

        /// <param name="key"> The key. </param>
        public bool Remove(TKey key)
        {
            if (IsUndefined)
            {
                return false;
            }
            return EnsureDictionary().Remove(key);
        }

        /// <param name="key"> The key to search for. </param>
        /// <param name="value"> The value. </param>
        public bool TryGetValue(TKey key, out TValue value)
        {
            if (IsUndefined)
            {
                value = default;
                return false;
            }
            return EnsureDictionary().TryGetValue(key, out value);
        }

        public IDictionary<TKey, TValue> EnsureDictionary()
        {
            return _innerDictionary ??= new Dictionary<TKey, TValue>();
        }
    }
}
