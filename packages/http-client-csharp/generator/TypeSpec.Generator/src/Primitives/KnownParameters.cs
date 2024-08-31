// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Runtime.CompilerServices;
using System.Threading;
using TypeSpec.Generator.Providers;
using TypeSpec.Generator.Snippets;
using TypeSpec.Generator.Statements;

namespace TypeSpec.Generator.Primitives
{
    public static partial class KnownParameters
    {
        private static ParameterProvider? _endpoint;
        public static ParameterProvider Endpoint => _endpoint ??= new("endpoint", $"Service endpoint", new CSharpType(typeof(Uri))) { Validation = ParameterValidationType.AssertNotNull };

        private static ParameterProvider? _nextLink;
        public static ParameterProvider NextLink => _nextLink ??= new("nextLink", $"Continuation token", typeof(string));

        private static ParameterProvider? _cancellationTokenParameter;
        public static ParameterProvider CancellationTokenParameter => _cancellationTokenParameter ??= new("cancellationToken", $"The cancellation token to use", new CSharpType(typeof(CancellationToken)), Snippet.DefaultOf(typeof(CancellationToken)));

        private static ParameterProvider? _enumerationCancellationTokenParameter;
        public static ParameterProvider EnumeratorCancellationTokenParameter => _enumerationCancellationTokenParameter ??= new("cancellationToken", $"Enumerator cancellation token", typeof(CancellationToken), Snippet.DefaultOf(typeof(CancellationToken)), attributes: [new AttributeStatement(typeof(EnumeratorCancellationAttribute))]);
    }
}
