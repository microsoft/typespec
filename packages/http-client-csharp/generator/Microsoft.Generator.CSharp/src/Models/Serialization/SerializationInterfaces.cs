// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp
{
    public abstract class SerializationInterfaces : IEnumerable<CSharpType>
    {
        protected SerializationInterfaces(TypeProvider typeProvider, bool hasJson, bool hasXml) { }

        public CSharpType? IJsonModelTInterface { get; init; }

        public CSharpType? IJsonModelObjectInterface { get; init; }

        public CSharpType? IPersistableModelTInterface { get; init; }

        public CSharpType? IPersistableModelObjectInterface { get; init; }

        private IReadOnlyList<CSharpType>? _interfaces;
        private IReadOnlyList<CSharpType> Interfaces => _interfaces ??= BuildInterfaces();

        /// <summary>
        /// Builds the list of interfaces for serialization for the type provider.
        /// </summary>
        /// <returns>The list of serialization interfaces the type provider implements.</returns>
        protected virtual IReadOnlyList<CSharpType> BuildInterfaces()
        {
            return Array.Empty<CSharpType>();
        }

        IEnumerator<CSharpType> IEnumerable<CSharpType>.GetEnumerator()
        {
            return Interfaces.GetEnumerator();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return Interfaces.GetEnumerator();
        }
    }
}
