// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator
{
    internal sealed class ProviderReferenceMapSession : IDisposable
    {
        private bool _disposed;

        public bool ShouldWriteProvider(TypeProvider provider) => ProviderReferenceMapAnalyzer.ShouldWriteProvider(provider);

        public void RestorePreWriteModelFactoryMethods() => ProviderReferenceMapAnalyzer.RestorePreWriteModelFactoryMethods();

        public void Dispose()
        {
            if (_disposed)
            {
                return;
            }

            ProviderReferenceMapAnalyzer.ResetPreWriteAccessibility();
            _disposed = true;
        }
    }
}
