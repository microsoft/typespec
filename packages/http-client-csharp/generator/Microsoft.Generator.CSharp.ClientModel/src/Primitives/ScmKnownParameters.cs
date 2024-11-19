// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Text.Json;
using System.Threading;
using System.Xml;
using System.Xml.Linq;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Primitives
{
    internal static class ScmKnownParameters
    {
        private static readonly CSharpType modelReaderWriterOptionsType = typeof(ModelReaderWriterOptions);
        private static readonly CSharpType nullableModelReaderWriterOptionsType = new CSharpType(typeof(ModelReaderWriterOptions), isNullable: true);

        public static readonly ParameterProvider XmlWriter = new("writer", FormattableStringHelpers.Empty, typeof(XmlWriter));
        public static readonly ParameterProvider NameHint = new("nameHint", FormattableStringHelpers.Empty, typeof(string));
        public static readonly ParameterProvider XElement = new("element", FormattableStringHelpers.Empty, typeof(XElement));
        public static readonly ParameterProvider Utf8JsonWriter = new("writer", FormattableStringHelpers.Empty, typeof(Utf8JsonWriter));
        public static readonly ParameterProvider Utf8JsonReader = new("reader", FormattableStringHelpers.Empty, typeof(Utf8JsonReader), isRef: true);
        public static readonly ParameterProvider JsonOptions = new("options", FormattableStringHelpers.Empty, typeof(JsonSerializerOptions));
        public static readonly ParameterProvider Options = new("options", FormattableStringHelpers.Empty, modelReaderWriterOptionsType);
        public static readonly ParameterProvider OptionalOptions = new("options", FormattableStringHelpers.Empty, nullableModelReaderWriterOptionsType, DefaultOf(nullableModelReaderWriterOptionsType));
        public static readonly ParameterProvider JsonElement = new("element", FormattableStringHelpers.Empty, typeof(JsonElement));
        public static readonly ParameterProvider Data = new("data", FormattableStringHelpers.Empty, typeof(BinaryData));
        public static ParameterProvider ClientOptions(CSharpType clientOptionsType)
            => new("options", $"The options for configuring the client.", clientOptionsType.WithNullable(true), initializationValue: New.Instance(clientOptionsType.WithNullable(true)));
        public static readonly ParameterProvider KeyAuth = new("keyCredential", $"The token credential to copy", ClientModelPlugin.Instance.TypeFactory.KeyCredentialType);
        public static readonly ParameterProvider MatchConditionsParameter = new("matchConditions", $"The content to send as the request conditions of the request.", ClientModelPlugin.Instance.TypeFactory.MatchConditionsType, DefaultOf(ClientModelPlugin.Instance.TypeFactory.MatchConditionsType));
        public static readonly ParameterProvider OptionalRequestOptions = new(
            ClientModelPlugin.Instance.TypeFactory.HttpRequestOptionsApi.ParameterName,
            $"The request options, which can override default behaviors of the client pipeline on a per-call basis.",
            ClientModelPlugin.Instance.TypeFactory.HttpRequestOptionsApi.HttpRequestOptionsType.WithNullable(true),
            defaultValue: Null);
        public static readonly ParameterProvider RequestOptions = new(ClientModelPlugin.Instance.TypeFactory.HttpRequestOptionsApi.ParameterName, $"The request options, which can override default behaviors of the client pipeline on a per-call basis.", ClientModelPlugin.Instance.TypeFactory.HttpRequestOptionsApi.HttpRequestOptionsType);
        public static readonly ParameterProvider RequestContent = new("content", $"The content to send as the body of the request.", ClientModelPlugin.Instance.TypeFactory.RequestContentApi.RequestContentType, location: ParameterLocation.Body) { Validation = ParameterValidationType.AssertNotNull };
        public static readonly ParameterProvider CancellationToken = new("cancellationToken", $"The cancellation token that can be used to cancel the operation.", new CSharpType(typeof(CancellationToken)), defaultValue: Default);

        // There is intentionally no default value here to avoid ambiguous calls between convenience and protocol methods.
        public static readonly ParameterProvider OptionalRequestContent = new(
            "content",
            $"The content to send as the body of the request.",
            ClientModelPlugin.Instance.TypeFactory.RequestContentApi.RequestContentType.WithNullable(true),
            location: ParameterLocation.Body);

        // Known header parameters
        public static readonly ParameterProvider RepeatabilityRequestId = new("repeatabilityRequestId", FormattableStringHelpers.Empty, typeof(Guid))
        {
            DefaultValue = Static(typeof(Guid)).Invoke(nameof(Guid.NewGuid)).Invoke(nameof(string.ToString))
        };
        public static readonly ParameterProvider RepeatabilityFirstSent = new("repeatabilityFirstSent", FormattableStringHelpers.Empty, typeof(DateTimeOffset))
        {
            DefaultValue = Static(typeof(DateTimeOffset)).Property(nameof(DateTimeOffset.Now))
        };

        public static readonly ParameterProvider ContentType = new("contentType", $"The contentType to use which has the multipart/form-data boundary.", typeof(string));
    }
}
