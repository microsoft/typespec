// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading;

namespace Microsoft.Generator.CSharp.Snippets
{
    public static class CancellationTokenSnippets
    {
        public static ScopedApi<bool> CanBeCanceled(this ScopedApi<CancellationToken> cancellationToken) => cancellationToken.Property(nameof(CancellationToken.CanBeCanceled)).As<bool>();
    }
}
