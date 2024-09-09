// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using Microsoft.CodeAnalysis;

namespace Microsoft.Generator.CSharp
{
    internal class ReferenceMap : IReadOnlyDictionary<INamedTypeSymbol, IEnumerable<INamedTypeSymbol>>
    {
        private Dictionary<INamedTypeSymbol, IEnumerable<INamedTypeSymbol>> _referenceMap;

        private List<INamedTypeSymbol> _globalReference;

        public ReferenceMap()
        {
            _referenceMap = new(SymbolEqualityComparer.Default);
            _globalReference = new();
        }

        /// <summary>
        /// Adds the value into the list corresponding to key
        /// </summary>
        /// <param name="key"></param>
        /// <param name="value"></param>
        /// <returns><code>true</code> if the value is added into the list, <code>false</code> if the value already exists in the list</returns>
        internal bool AddInList(INamedTypeSymbol key, INamedTypeSymbol value)
        {
            if (_referenceMap.TryGetValue(key, out var list))
            {
                // the list is guaranteed to be a HashSet
                var set = (HashSet<INamedTypeSymbol>)list;
                return set.Add(value);
            }
            else
            {
                var newList = new HashSet<INamedTypeSymbol>(SymbolEqualityComparer.Default) { value };
                _referenceMap.Add(key, newList);
                return true;
            }
        }

        internal void AddGlobal(INamedTypeSymbol typeSymbol)
        {
            _globalReference.Add(typeSymbol);
        }

        public IEnumerable<INamedTypeSymbol> GlobalReferencedSymbols => _globalReference;

        public IEnumerable<INamedTypeSymbol> this[INamedTypeSymbol key] => _referenceMap[key];

        public IEnumerable<INamedTypeSymbol> Keys => _referenceMap.Keys;

        public IEnumerable<IEnumerable<INamedTypeSymbol>> Values => _referenceMap.Values;

        public int Count => _referenceMap.Count;

        public bool ContainsKey(INamedTypeSymbol key) => _referenceMap.ContainsKey(key);

        public IEnumerator<KeyValuePair<INamedTypeSymbol, IEnumerable<INamedTypeSymbol>>> GetEnumerator() =>
            _referenceMap.GetEnumerator();

        public bool TryGetValue(INamedTypeSymbol key, [MaybeNullWhen(false)] out IEnumerable<INamedTypeSymbol> value) =>
            _referenceMap.TryGetValue(key, out value);

        IEnumerator IEnumerable.GetEnumerator() => _referenceMap.GetEnumerator();
    }
}
