// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Internal;
using System.ClientModel.Primitives;
using System.ClientModel.Primitives.Pipeline;
using AutoRest.CSharp.Common.Output.Expressions;
using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;
using AutoRest.CSharp.Common.Output.Expressions.System;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Requests;
using Azure.Core.Pipeline; //needed because BearerTokenAuthenticationPolicy doesn't exist in System.ServiceModel.Rest yet
using RequestBody = System.ClientModel.Primitives.RequestBody;

namespace AutoRest.CSharp.Common.Input
{
    internal class SystemApiTypes : ApiTypes
    {
        public override Type ResponseType => typeof(Result);
        public override Type ResponseOfTType => typeof(Result<>);
        public override string ResponseParameterName => "result";
        public override string ContentStreamName => $"{GetRawResponseName}().{nameof(PipelineResponse.ContentStream)}";
        public override string StatusName => $"{GetRawResponseName}().{nameof(PipelineResponse.Status)}";
        public override string GetRawResponseName => nameof(Result<object>.GetRawResponse);

        public override Type HttpPipelineType => typeof(MessagePipeline);
        public override Type PipelineExtensionsType => typeof(PipelineProtocolExtensions);
        public override string HttpPipelineCreateMessageName => nameof(MessagePipeline.CreateMessage);

        public override Type HttpMessageType => typeof(PipelineMessage);
        public override string HttpMessageResponseName => nameof(PipelineMessage.Response);

        public override Type ClientDiagnosticsType => typeof(TelemetrySource);
        public override string ClientDiagnosticsCreateScopeName => nameof(TelemetrySource.CreateSpan);

        public override Type ClientOptionsType => typeof(RequestOptions);

        public override Type RequestContextType => typeof(RequestOptions);

        public override Type ChangeTrackingDictionaryType => typeof(OptionalDictionary<,>);

        public override Type BearerAuthenticationPolicyType => typeof(BearerTokenAuthenticationPolicy);
        public override Type KeyCredentialType => typeof(KeyCredential);
        public override Type HttpPipelineBuilderType => typeof(MessagePipeline);
        public override Type KeyCredentialPolicyType => typeof(KeyCredentialPolicy);
        public override FormattableString GetHttpPipelineClassifierString(string pipelineField, string optionsVariable, FormattableString perCallPolicies, FormattableString perRetryPolicies)
            => $"{pipelineField:I} = {typeof(MessagePipeline)}.{nameof(MessagePipeline.Create)}({optionsVariable:I}, {perRetryPolicies}, {perCallPolicies});";

        public override Type HttpPipelinePolicyType => typeof(IPipelinePolicy<PipelineMessage>);

        public override string HttpMessageRequestName => nameof(PipelineMessage.Request);

        public override FormattableString GetSetMethodString(string requestName, string method)
        {
            return $"{requestName}.{nameof(PipelineRequest.SetMethod)}(\"{method}\");";
        }

        private string GetHttpMethodName(string method)
        {
            return $"{method[0]}{method.Substring(1).ToLowerInvariant()}";
        }

        public override FormattableString GetSetUriString(string requestName, string uriName)
            => $"{requestName}.Uri = {uriName}.{nameof(RequestUri.ToUri)}();";

        public override Action<CodeWriter, CodeWriterDeclaration, RequestHeader, ClientFields?> WriteHeaderMethod => RequestWriterHelpers.WriteHeaderSystem;

        public override FormattableString GetSetContentString(string requestName, string contentName)
            => $"{requestName}.Content = {contentName};";

        public override Type RequestUriType => typeof(RequestUri);
        public override Type RequestContentType => typeof(RequestBody);
        public override string ToRequestContentName => "ToRequestBody";
        public override string RequestContentCreateName => nameof(RequestBody.CreateFromStream);

        public override Type IUtf8JsonSerializableType => typeof(IUtf8JsonWriteable);

        public override Type IXmlSerializableType => throw new NotSupportedException("Xml serialization is not supported in non-branded libraries yet");

        public override Type Utf8JsonWriterExtensionsType => typeof(ModelSerializationExtensions);

        public override Type RequestFailedExceptionType => typeof(MessageFailedException);

        public override Type ResponseClassifierType => typeof(ResponseErrorClassifier);
        public override Type StatusCodeClassifierType => typeof(StatusResponseClassifier);

        public override ValueExpression GetCreateFromStreamSampleExpression(ValueExpression freeFormObjectExpression)
            => new InvokeStaticMethodExpression(Configuration.ApiTypes.RequestContentType, Configuration.ApiTypes.RequestContentCreateName, new[]{ BinaryDataExpression.FromObjectAsJson(freeFormObjectExpression).ToStream() });

        public override string EndPointSampleValue => "https://my-service.com";

        public override string JsonElementVariableName => "element";

        public override ValueExpression GetKeySampleExpression(string clientName)
            => new InvokeStaticMethodExpression(typeof(Environment), nameof(Environment.GetEnvironmentVariable), new[] { new StringLiteralExpression($"{clientName}_KEY", false) });

        public override ExtensibleSnippets ExtensibleSnippets { get; } = new SystemExtensibleSnippets();

        public override string LicenseString => string.Empty;
    }
}
