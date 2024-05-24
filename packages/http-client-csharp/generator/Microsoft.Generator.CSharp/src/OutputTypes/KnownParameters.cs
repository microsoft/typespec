// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Runtime.CompilerServices;
using System.Threading;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp
{
    public partial class KnownParameters
    {
        private static readonly CSharpType RequestContentType = new(CodeModelPlugin.Instance.Configuration.ApiTypes.RequestContentType);
        private static readonly CSharpType RequestContentNullableType = new(CodeModelPlugin.Instance.Configuration.ApiTypes.RequestContentType, true);
        private static readonly CSharpType RequestContextType = new(CodeModelPlugin.Instance.Configuration.ApiTypes.RequestContextType);
        private static readonly CSharpType RequestContextNullableType = new(CodeModelPlugin.Instance.Configuration.ApiTypes.RequestContextType, true);
        private static readonly CSharpType ResponseType = new(CodeModelPlugin.Instance.Configuration.ApiTypes.ResponseType);

        public Parameter TokenAuth => new("tokenCredential", $"The token credential to copy", CodeModelPlugin.Instance.TypeFactory.TokenCredentialType(), null, ParameterValidationType.None, null);
        public Parameter PageSizeHint => new("pageSizeHint", $"The number of items per {CodeModelPlugin.Instance.TypeFactory.PageResponseType():C} that should be requested (from service operations that support it). It's not guaranteed that the value will be respected.", new CSharpType(typeof(int), true), null, ParameterValidationType.None, null);
        public Parameter MatchConditionsParameter => new("matchConditions", $"The content to send as the request conditions of the request.", CodeModelPlugin.Instance.TypeFactory.MatchConditionsType(), Snippet.DefaultOf(CodeModelPlugin.Instance.TypeFactory.RequestConditionsType()), ParameterValidationType.None, null, RequestLocation: RequestLocation.Header);
        public Parameter RequestConditionsParameter => new("requestConditions", $"The content to send as the request conditions of the request.", CodeModelPlugin.Instance.TypeFactory.RequestConditionsType(), Snippet.DefaultOf(CodeModelPlugin.Instance.TypeFactory.RequestConditionsType()), ParameterValidationType.None, null, RequestLocation: RequestLocation.Header);

        public static readonly Parameter Pipeline = new("pipeline", $"The HTTP pipeline for sending and receiving REST requests and responses", new CSharpType(CodeModelPlugin.Instance.Configuration.ApiTypes.HttpPipelineType), null, ParameterValidationType.AssertNotNull, null);
        public static readonly Parameter KeyAuth = new("keyCredential", $"The key credential to copy", new CSharpType(CodeModelPlugin.Instance.Configuration.ApiTypes.KeyCredentialType), null, ParameterValidationType.None, null);
        public static readonly Parameter Endpoint = new("endpoint", $"Service endpoint", new CSharpType(typeof(Uri)), null, ParameterValidationType.None, null, RequestLocation: RequestLocation.Uri, IsEndpoint: true);

        public static readonly Parameter NextLink = new("nextLink", $"Continuation token", typeof(string), null, ParameterValidationType.None, null);

        public static readonly Parameter RequestContent = new("content", $"The content to send as the body of the request.", RequestContentType, null, ParameterValidationType.AssertNotNull, null, RequestLocation: RequestLocation.Body);
        public static readonly Parameter RequestContentNullable = new("content", $"The content to send as the body of the request.", RequestContentNullableType, null, ParameterValidationType.None, null, RequestLocation: RequestLocation.Body);

        public static readonly Parameter RequestContext = new("context", $"The request context, which can override default behaviors of the client pipeline on a per-call basis.", RequestContextNullableType, Snippet.DefaultOf(RequestContextNullableType), ParameterValidationType.None, null);
        public static readonly Parameter RequestContextRequired = new("context", $"The request context, which can override default behaviors of the client pipeline on a per-call basis.", RequestContextType, null, ParameterValidationType.None, null);

        public static readonly Parameter CancellationTokenParameter = new("cancellationToken", $"The cancellation token to use", new CSharpType(typeof(CancellationToken)), Snippet.DefaultOf(typeof(CancellationToken)), ParameterValidationType.None, null);
        public static readonly Parameter EnumeratorCancellationTokenParameter = new("cancellationToken", $"Enumerator cancellation token", typeof(CancellationToken), Snippet.DefaultOf(typeof(CancellationToken)), ParameterValidationType.None, null) { Attributes = new[] { new CSharpAttribute(typeof(EnumeratorCancellationAttribute)) } };

        public static readonly Parameter Response = new("response", $"Response returned from backend service", ResponseType, null, ParameterValidationType.None, null);
    }
}
