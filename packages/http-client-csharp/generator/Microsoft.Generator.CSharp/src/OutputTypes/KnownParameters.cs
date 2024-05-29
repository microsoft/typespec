// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Runtime.CompilerServices;
using System.Threading;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp
{
    public partial class KnownParameters
    {
        public TypeFactory TypeFactory { get; }
        public KnownParameters(TypeFactory typeFactory)
        {
            TypeFactory = typeFactory;
        }

        private static readonly CSharpType RequestContentType = new(CodeModelPlugin.Instance.Configuration.ApiTypes.RequestContentType);
        private static readonly CSharpType RequestContentNullableType = new(CodeModelPlugin.Instance.Configuration.ApiTypes.RequestContentType, true);
        private static readonly CSharpType RequestContextType = new(CodeModelPlugin.Instance.Configuration.ApiTypes.RequestContextType);
        private static readonly CSharpType RequestContextNullableType = new(CodeModelPlugin.Instance.Configuration.ApiTypes.RequestContextType, true);
        private static readonly CSharpType ResponseType = new(CodeModelPlugin.Instance.Configuration.ApiTypes.ResponseType);

        public Parameter TokenAuth => new("tokenCredential", $"The token credential to copy", TypeFactory.TokenCredentialType());
        public Parameter MatchConditionsParameter => new("matchConditions", $"The content to send as the request conditions of the request.", TypeFactory.MatchConditionsType(), Snippets.DefaultOf(TypeFactory.RequestConditionsType()));
        public Parameter RequestConditionsParameter => new("requestConditions", $"The content to send as the request conditions of the request.", TypeFactory.RequestConditionsType(), Snippets.DefaultOf(TypeFactory.RequestConditionsType()));

        public static readonly Parameter Pipeline = new("pipeline", $"The HTTP pipeline for sending and receiving REST requests and responses", new CSharpType(CodeModelPlugin.Instance.Configuration.ApiTypes.HttpPipelineType));
        public static readonly Parameter KeyAuth = new("keyCredential", $"The key credential to copy", new CSharpType(CodeModelPlugin.Instance.Configuration.ApiTypes.KeyCredentialType));
        public static readonly Parameter Endpoint = new("endpoint", $"Service endpoint", new CSharpType(typeof(Uri)));

        public static readonly Parameter NextLink = new("nextLink", $"Continuation token", typeof(string));

        public static readonly Parameter RequestContent = new("content", $"The content to send as the body of the request.", RequestContentType);
        public static readonly Parameter RequestContentNullable = new("content", $"The content to send as the body of the request.", RequestContentNullableType);

        public static readonly Parameter RequestContext = new("context", $"The request context, which can override default behaviors of the client pipeline on a per-call basis.", RequestContextNullableType, Snippets.DefaultOf(RequestContextNullableType));
        public static readonly Parameter RequestContextRequired = new("context", $"The request context, which can override default behaviors of the client pipeline on a per-call basis.", RequestContextType);

        public static readonly Parameter CancellationTokenParameter = new("cancellationToken", $"The cancellation token to use", new CSharpType(typeof(CancellationToken)), Snippets.DefaultOf(typeof(CancellationToken)));
        public static readonly Parameter EnumeratorCancellationTokenParameter = new("cancellationToken", $"Enumerator cancellation token", typeof(CancellationToken), Snippets.DefaultOf(typeof(CancellationToken))) { Attributes = new[] { new CSharpAttribute(typeof(EnumeratorCancellationAttribute)) } };

        public static readonly Parameter Response = new("response", $"Response returned from backend service", ResponseType);
    }
}
