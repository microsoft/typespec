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
    public class MethodProviderCollection : IReadOnlyList<MethodProvider>
    {
        private IReadOnlyList<MethodProvider>? _cSharpMethods;
        protected InputServiceMethod ServiceMethod { get; }
        protected TypeProvider EnclosingType { get; private init; }

        public MethodProviderCollection(InputServiceMethod serviceMethod, TypeProvider enclosingType)
        {
            ServiceMethod = serviceMethod;
            EnclosingType = enclosingType;
        }

        protected virtual IReadOnlyList<MethodProvider> BuildMethods() => [];
        public IReadOnlyList<MethodProvider> MethodProviders => _cSharpMethods ??= BuildMethods();

        public MethodProvider this[int index]
        {
            get { return MethodProviders[index]; }
        }

        public int Count
        {
            get { return MethodProviders.Count; }
        }

        public IEnumerator<MethodProvider> GetEnumerator()
        {
            return MethodProviders.GetEnumerator();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }
    }
}
