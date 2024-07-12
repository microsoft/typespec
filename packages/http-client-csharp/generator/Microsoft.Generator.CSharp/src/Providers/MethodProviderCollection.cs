// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp.Providers
{
    /// <summary>
    /// Represents an immutable collection of methods that are associated with an operation <see cref="InputOperation"/>.
    /// </summary>
    public class MethodProviderCollection : IReadOnlyList<MethodProvider>
    {
        private IReadOnlyList<MethodProvider>? _cSharpMethods;
        protected InputOperation Operation { get; private init; }
        protected TypeProvider EnclosingType { get; private init; }

        public MethodProviderCollection(InputOperation operation, TypeProvider enclosingType)
        {
            Operation = operation;
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
