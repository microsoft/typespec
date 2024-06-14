// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Runtime.CompilerServices;
using System.Threading;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp
{
    public static partial class KnownParameters
    {
        private static ParameterProvider? _tokenAuth;
        public static ParameterProvider TokenAuth => _tokenAuth ??= new("tokenCredential", $"The token credential to copy", CodeModelPlugin.Instance.TypeFactory.TokenCredentialType());

        private static ParameterProvider? _matchConditionsParameter;
        public static ParameterProvider MatchConditionsParameter => _matchConditionsParameter ??= new("matchConditions", $"The content to send as the request conditions of the request.", CodeModelPlugin.Instance.TypeFactory.MatchConditionsType(), Snippet.DefaultOf(CodeModelPlugin.Instance.TypeFactory.RequestConditionsType()));

        private static ParameterProvider? _requestConditionsParameter;
        public static ParameterProvider RequestConditionsParameter => _requestConditionsParameter ??= new("requestConditions", $"The content to send as the request conditions of the request.", CodeModelPlugin.Instance.TypeFactory.RequestConditionsType(), Snippet.DefaultOf(CodeModelPlugin.Instance.TypeFactory.RequestConditionsType()));

        private static ParameterProvider? _pipeline;
        public static ParameterProvider Pipeline => _pipeline ??= new("pipeline", $"The HTTP pipeline for sending and receiving REST requests and responses", new CSharpType(CodeModelPlugin.Instance.Configuration.ApiTypes.HttpPipelineType));

        private static ParameterProvider? _keyAuth;
        public static ParameterProvider KeyAuth => _keyAuth ??= new("keyCredential", $"The key credential to copy", new CSharpType(CodeModelPlugin.Instance.Configuration.ApiTypes.KeyCredentialType));

        private static ParameterProvider? _endpoint;
        public static ParameterProvider Endpoint => _endpoint ??= new("endpoint", $"Service endpoint", new CSharpType(typeof(Uri)));

        private static ParameterProvider? _nextLink;
        public static ParameterProvider NextLink => _nextLink ??= new("nextLink", $"Continuation token", typeof(string));

        private static ParameterProvider? _requestContent;
        public static ParameterProvider RequestContent => _requestContent ??= new("content", $"The content to send as the body of the request.", CodeModelPlugin.Instance.Configuration.ApiTypes.RequestContentType);

        private static ParameterProvider? _requestContentNullable;
        public static ParameterProvider RequestContentNullable => _requestContentNullable ??= new("content", $"The content to send as the body of the request.", new(CodeModelPlugin.Instance.Configuration.ApiTypes.RequestContentType, true));

        private static ParameterProvider? _requestContext;
        public static ParameterProvider RequestContext => _requestContext ??= new("context", $"The request context, which can override default behaviors of the client pipeline on a per-call basis.", new(CodeModelPlugin.Instance.Configuration.ApiTypes.RequestContextType, true), Snippet.DefaultOf(new(CodeModelPlugin.Instance.Configuration.ApiTypes.RequestContextType, true)));

        private static ParameterProvider? _requestContextRequired;
        public static ParameterProvider RequestContextRequired => _requestContextRequired ??= new("context", $"The request context, which can override default behaviors of the client pipeline on a per-call basis.", CodeModelPlugin.Instance.Configuration.ApiTypes.RequestContextType);

        private static ParameterProvider? _cancellationTokenParameter;
        public static ParameterProvider CancellationTokenParameter => _cancellationTokenParameter ??= new("cancellationToken", $"The cancellation token to use", new CSharpType(typeof(CancellationToken)), Snippet.DefaultOf(typeof(CancellationToken)));

        private static ParameterProvider? _enumerationCancellationTokenParameter;
        public static ParameterProvider EnumeratorCancellationTokenParameter => _enumerationCancellationTokenParameter ??= new("cancellationToken", $"Enumerator cancellation token", typeof(CancellationToken), Snippet.DefaultOf(typeof(CancellationToken))) { Attributes = new[] { new AttributeStatement(typeof(EnumeratorCancellationAttribute)) } };

        private static ParameterProvider? _response;
        public static ParameterProvider Response => _response ??= new("response", $"Response returned from backend service", CodeModelPlugin.Instance.Configuration.ApiTypes.ResponseType);
    }
}
