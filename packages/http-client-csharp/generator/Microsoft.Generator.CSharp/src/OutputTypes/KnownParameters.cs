// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Runtime.CompilerServices;
using System.Threading;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp
{
    public static partial class KnownParameters
    {
        private static ParameterProvider? _cancellationTokenParameter;
        public static ParameterProvider CancellationTokenParameter => _cancellationTokenParameter ??= new("cancellationToken", $"The cancellation token to use", new CSharpType(typeof(CancellationToken)), Snippet.DefaultOf(typeof(CancellationToken)));

        private static ParameterProvider? _enumerationCancellationTokenParameter;
        public static ParameterProvider EnumeratorCancellationTokenParameter => _enumerationCancellationTokenParameter ??= new("cancellationToken", $"Enumerator cancellation token", typeof(CancellationToken), Snippet.DefaultOf(typeof(CancellationToken))) { Attributes = new[] { new CSharpAttribute(typeof(EnumeratorCancellationAttribute)) } };
    }
}
