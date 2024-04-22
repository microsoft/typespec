﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Runtime.CompilerServices;
using System.Threading;
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

        public Parameter TokenAuth => new("tokenCredential", $"The token credential to copy", TypeFactory.TokenCredentialType(), null, ValidationType.None, null);
        public Parameter PageSizeHint => new("pageSizeHint", $"The number of items per {TypeFactory.PageResponseType():C} that should be requested (from service operations that support it). It's not guaranteed that the value will be respected.", new CSharpType(typeof(int), true), null, ValidationType.None, null);
        public Parameter MatchConditionsParameter => new("matchConditions", $"The content to send as the request conditions of the request.", TypeFactory.MatchConditionsType(), Constant.Default(TypeFactory.RequestConditionsType()), ValidationType.None, null, RequestLocation: RequestLocation.Header);
        public Parameter RequestConditionsParameter => new("requestConditions", $"The content to send as the request conditions of the request.", TypeFactory.RequestConditionsType(), Constant.Default(TypeFactory.RequestConditionsType()), ValidationType.None, null, RequestLocation: RequestLocation.Header);

        public static readonly Parameter ClientDiagnostics = new("clientDiagnostics", $"The handler for diagnostic messaging in the client.", new CSharpType(CodeModelPlugin.Instance.Configuration.ApiTypes.ClientDiagnosticsType), null, ValidationType.AssertNotNull, null);
        public static readonly Parameter Pipeline = new("pipeline", $"The HTTP pipeline for sending and receiving REST requests and responses", new CSharpType(CodeModelPlugin.Instance.Configuration.ApiTypes.HttpPipelineType), null, ValidationType.AssertNotNull, null);
        public static readonly Parameter KeyAuth = new("keyCredential", $"The key credential to copy", new CSharpType(CodeModelPlugin.Instance.Configuration.ApiTypes.KeyCredentialType), null, ValidationType.None, null);
        public static readonly Parameter Endpoint = new("endpoint", $"Service endpoint", new CSharpType(typeof(Uri)), null, ValidationType.None, null, RequestLocation: RequestLocation.Uri, IsEndpoint: true);

        public static readonly Parameter NextLink = new("nextLink", $"Continuation token", typeof(string), null, ValidationType.None, null);

        public static readonly Parameter RequestContent = new("content", $"The content to send as the body of the request.", RequestContentType, null, ValidationType.AssertNotNull, null, RequestLocation: RequestLocation.Body);
        public static readonly Parameter RequestContentNullable = new("content", $"The content to send as the body of the request.", RequestContentNullableType, null, ValidationType.None, null, RequestLocation: RequestLocation.Body);

        public static readonly Parameter RequestContext = new("context", $"The request context, which can override default behaviors of the client pipeline on a per-call basis.", RequestContextNullableType, Constant.Default(RequestContextNullableType), ValidationType.None, null);
        public static readonly Parameter RequestContextRequired = new("context", $"The request context, which can override default behaviors of the client pipeline on a per-call basis.", RequestContextType, null, ValidationType.None, null);

        public static readonly Parameter CancellationTokenParameter = new("cancellationToken", $"The cancellation token to use", new CSharpType(typeof(CancellationToken)), Constant.NewInstanceOf(typeof(CancellationToken)), ValidationType.None, null);
        public static readonly Parameter EnumeratorCancellationTokenParameter = new("cancellationToken", $"Enumerator cancellation token", typeof(CancellationToken), Constant.NewInstanceOf(typeof(CancellationToken)), ValidationType.None, null) { Attributes = new[] { new CSharpAttribute(typeof(EnumeratorCancellationAttribute)) } };

        public static readonly Parameter Response = new("response", $"Response returned from backend service", ResponseType, null, ValidationType.None, null);
    }
}
