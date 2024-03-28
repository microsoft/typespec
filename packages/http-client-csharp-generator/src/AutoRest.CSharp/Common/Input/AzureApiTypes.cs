// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using AutoRest.CSharp.Common.Output.Expressions;
using AutoRest.CSharp.Common.Output.Expressions.Azure;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Requests;
using AutoRest.CSharp.Utilities;
using Azure;
using Azure.Core;
using Azure.Core.Pipeline;

namespace AutoRest.CSharp.Common.Input
{
    internal class AzureApiTypes : ApiTypes
    {
        public override Type ResponseType => typeof(Response);
        public override Type ResponseOfTType => typeof(Response<>);
        public override string ResponseParameterName => "response";
        public override string ContentStreamName => nameof(Response.ContentStream);
        public override string StatusName => nameof(Response.Status);
        public override string GetRawResponseName => nameof(Response<object>.GetRawResponse);

        public override Type HttpPipelineType => typeof(HttpPipeline);
        public override Type PipelineExtensionsType => typeof(HttpPipelineExtensions);
        public override string HttpPipelineCreateMessageName => nameof(HttpPipeline.CreateMessage);

        public override Type HttpMessageType => typeof(HttpMessage);
        public override string HttpMessageResponseName => nameof(HttpMessage.Response);

        public override Type ClientDiagnosticsType => typeof(ClientDiagnostics);
        public override string ClientDiagnosticsCreateScopeName => nameof(ClientDiagnostics.CreateScope);

        public override Type ClientOptionsType => typeof(ClientOptions);

        public override Type RequestContextType => typeof(RequestContext);

        public override Type ChangeTrackingDictionaryType => typeof(ChangeTrackingDictionary<,>);

        public override Type BearerAuthenticationPolicyType => typeof(BearerTokenAuthenticationPolicy);
        public override Type KeyCredentialType => typeof(AzureKeyCredential);
        public override Type HttpPipelineBuilderType => typeof(HttpPipelineBuilder);
        public override Type KeyCredentialPolicyType => typeof(AzureKeyCredentialPolicy);
        public override FormattableString GetHttpPipelineClassifierString(string pipelineField, string optionsVariable, FormattableString perCallPolicies, FormattableString perRetryPolicies)
            => $"{pipelineField:I} = {typeof(HttpPipelineBuilder)}.{nameof(HttpPipelineBuilder.Build)}({optionsVariable:I}, {perCallPolicies}, {perRetryPolicies}, new {Configuration.ApiTypes.ResponseClassifierType}());";

        public override Type HttpPipelinePolicyType => typeof(HttpPipelinePolicy);
        public override string HttpMessageRequestName => nameof(HttpMessage.Request);

        public override FormattableString GetSetMethodString(string requestName, string method)
            => $"{requestName}.Method = {typeof(RequestMethod)}.{RequestMethod.Parse(method).ToRequestMethodName()};";
        public override FormattableString GetSetUriString(string requestName, string uriName)
            => $"{requestName}.Uri = {uriName};";

        public override Action<CodeWriter, CodeWriterDeclaration, RequestHeader, ClientFields?> WriteHeaderMethod => RequestWriterHelpers.WriteHeader;

        public override FormattableString GetSetContentString(string requestName, string contentName)
            => $"{requestName}.Content = {contentName};";

        public override Type RequestUriType => typeof(RawRequestUriBuilder);
        public override Type RequestContentType => typeof(RequestContent);
        public override string ToRequestContentName => "ToRequestContent";
        public override string RequestContentCreateName => nameof(RequestContent.Create);

        public override Type IUtf8JsonSerializableType => typeof(IUtf8JsonSerializable);

        public override Type IXmlSerializableType => typeof(IXmlSerializable);

        public override Type Utf8JsonWriterExtensionsType => typeof(Utf8JsonWriterExtensions);

        public override Type RequestFailedExceptionType => typeof(RequestFailedException);

        public override Type ResponseClassifierType => typeof(ResponseClassifier);
        public override Type StatusCodeClassifierType => typeof(StatusCodeClassifier);

        public override ValueExpression GetCreateFromStreamSampleExpression(ValueExpression freeFormObjectExpression)
            => new InvokeStaticMethodExpression(Configuration.ApiTypes.RequestContentType, Configuration.ApiTypes.RequestContentCreateName, new[]{freeFormObjectExpression});

        public override string EndPointSampleValue => "<https://my-service.azure.com>";

        public override string JsonElementVariableName => "result";

        public override ValueExpression GetKeySampleExpression(string clientName)
            => new StringLiteralExpression("<key>", false);

        public override ExtensibleSnippets ExtensibleSnippets { get; } = new AzureExtensibleSnippets();

        public override string LicenseString => """
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.


""";
    }
}
