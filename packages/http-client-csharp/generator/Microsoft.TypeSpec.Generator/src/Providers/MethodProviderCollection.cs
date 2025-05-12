// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Input;

namespace Microsoft.TypeSpec.Generator.Providers
{
    /// <summary>
    /// Represents an immutable collection of methods that are associated with a service method <see cref="InputServiceMethod"/>.
    /// </summary>
    public class MethodProviderCollection<T> : IReadOnlyList<T> where T : MethodProvider
    {
        private IReadOnlyList<T>? _cSharpMethods;
        protected InputServiceMethod ServiceMethod { get; }
        protected virtual TypeProvider EnclosingType { get; private init; }

        public MethodProviderCollection(InputServiceMethod serviceMethod, TypeProvider enclosingType)
        {
            ServiceMethod = serviceMethod;
            EnclosingType = enclosingType;
        }

        protected virtual IReadOnlyList<T> BuildMethods() => [];
        public IReadOnlyList<T> MethodProviders => _cSharpMethods ??= BuildMethods();

        public T this[int index]
        {
            get { return MethodProviders[index]; }
        }

        public int Count
        {
            get { return MethodProviders.Count; }
        }

        public IEnumerator<T> GetEnumerator()
        {
            return MethodProviders.GetEnumerator();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }
    }
}
