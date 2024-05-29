// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel
{
    /// <summary>
    /// Represents API types as part of the <see cref="System"/> namespace.
    /// </summary>
    internal class SystemApiTypes : ApiTypes
    {
        public override Type ResponseType => typeof(ClientResult);
        public override Type ResponseOfTType => typeof(ClientResult<>);
        public override string ResponseParameterName => "result";
        public override string ContentStreamName => $"{GetRawResponseName}().{nameof(PipelineResponse.ContentStream)}";
        public override string StatusName => $"{GetRawResponseName}().{nameof(PipelineResponse.Status)}";
        public override string GetRawResponseName => nameof(ClientResult<object>.GetRawResponse);

        public override Type HttpPipelineType => typeof(ClientPipeline);
        public override string HttpPipelineCreateMessageName => nameof(ClientPipeline.CreateMessage);

        public override Type HttpMessageType => typeof(PipelineMessage);
        public override string HttpMessageResponseName => nameof(PipelineMessage.Response);
        public override string HttpMessageResponseStatusName => nameof(PipelineResponse.Status);

        public override Type ClientOptionsType => typeof(RequestOptions);

        public override Type RequestContextType => typeof(RequestOptions);

        public override Type BearerAuthenticationPolicyType => throw new NotSupportedException("Bearer authentication is not supported in non-branded libraries yet");
        public override Type KeyCredentialType => typeof(ApiKeyCredential);
        public override Type HttpPipelineBuilderType => typeof(ClientPipeline);
        public override Type KeyCredentialPolicyType => typeof(ApiKeyAuthenticationPolicy);
        public override FormattableString GetHttpPipelineBearerString(string pipelineField, string optionsVariable, string credentialVariable, string scopesParamName)
            => $"{pipelineField} = {HttpPipelineBuilderType}.Build({optionsVariable}, new {BearerAuthenticationPolicyType}({credentialVariable}, {new CodeWriterDeclaration(scopesParamName)}));";
        public override FormattableString GetHttpPipelineClassifierString(string pipelineField, string optionsVariable, FormattableString perCallPolicies, FormattableString perRetryPolicies, FormattableString beforeTransportPolicies)
            => $"{pipelineField:I} = {typeof(ClientPipeline)}.{nameof(ClientPipeline.Create)}({optionsVariable:I}, {perCallPolicies}, {perRetryPolicies}, {beforeTransportPolicies});";

        public override Type HttpPipelinePolicyType => typeof(PipelinePolicy);

        public override string HttpMessageRequestName => nameof(PipelineMessage.Request);

        public override FormattableString GetSetMethodString(string requestName, string method)
        {
            return $"{requestName}.{nameof(PipelineRequest.Method)}(\"{method}\");";
        }

        private string GetHttpMethodName(string method)
        {
            return $"{method[0]}{method.Substring(1).ToLowerInvariant()}";
        }

        public override FormattableString GetSetUriString(string requestName, string uriName)
            => $"{requestName}.Uri = {uriName}.ToUri();";

        public override FormattableString GetSetContentString(string requestName, string contentName)
            => $"{requestName}.Content = {contentName};";

        public override Type RequestContentType => typeof(BinaryContent);
        public override string CancellationTokenName => nameof(RequestOptions.CancellationToken);
        public override string ToRequestContentName => "ToRequestBody";
        public override string RequestContentCreateName => nameof(BinaryContent.Create);

        public override Type IXmlSerializableType => throw new NotSupportedException("Xml serialization is not supported in non-branded libraries yet");

        public override Type RequestFailedExceptionType => typeof(ClientResultException);

        public override string ResponseClassifierIsErrorResponseName => nameof(PipelineMessageClassifier.TryClassify);

        public override Type ResponseClassifierType => typeof(PipelineMessageClassifier);
        public override Type StatusCodeClassifierType => typeof(PipelineMessageClassifier);

        public override ValueExpression GetCreateFromStreamSampleExpression(ValueExpression freeFormObjectExpression)
            => new InvokeStaticMethodExpression(ClientModelPlugin.Instance.Configuration.ApiTypes.RequestContentType, ClientModelPlugin.Instance.Configuration.ApiTypes.RequestContentCreateName, [BinaryDataSnippet.FromObjectAsJson(freeFormObjectExpression).ToStream()]);

        public override string EndPointSampleValue => "https://my-service.com";

        public override string JsonElementVariableName => "element";

        public override ValueExpression GetKeySampleExpression(string clientName)
            => new InvokeStaticMethodExpression(typeof(Environment), nameof(Environment.GetEnvironmentVariable), [Snippet.Literal($"{clientName}_KEY")]);
    }
}
