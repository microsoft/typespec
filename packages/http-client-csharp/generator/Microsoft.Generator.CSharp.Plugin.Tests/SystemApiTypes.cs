// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Plugin.Tests;

namespace Microsoft.Generator.CSharp.ClientModel
{
    /// <summary>
    /// Represents API types as part of the <see cref="System"/> namespace.
    /// </summary>
    internal class SystemApiTypes : ApiTypes
    {
        public override Type ChangeTrackingListType => typeof(List<>);
        public override Type ChangeTrackingDictionaryType => typeof(Dictionary<,>);
        public override Type ResponseType => typeof(object);
        public override Type ResponseOfTType => typeof(List<>);
        public override string ResponseParameterName => "result";
        public override string ContentStreamName => $"{GetRawResponseName}";
        public override string StatusName => $"{GetRawResponseName}";
        public override string GetRawResponseName => "GetRawResponse";

        public override Type HttpPipelineType => typeof(object);
        public override Type PipelineExtensionsType => typeof(object);
        public override string HttpPipelineCreateMessageName => "CreateMessage";

        public override Type HttpMessageType => typeof(object);
        public override string HttpMessageResponseName => "Response";
        public override string HttpMessageResponseStatusName => "PipelineResponseStatus";

        public override Type ClientDiagnosticsType => typeof(object);
        public override string ClientDiagnosticsCreateScopeName => "TelemetrySource";

        public override Type ClientOptionsType => typeof(object);

        public override Type RequestContextType => typeof(object);

        public override Type BearerAuthenticationPolicyType => throw new NotSupportedException("Bearer authentication is not supported in non-branded libraries yet");
        public override Type KeyCredentialType => typeof(object);
        public override Type HttpPipelineBuilderType => typeof(object);
        public override Type KeyCredentialPolicyType => typeof(object);
        public override FormattableString GetHttpPipelineBearerString(string pipelineField, string optionsVariable, string credentialVariable, string scopesParamName)
            => $"{pipelineField} = {HttpPipelineBuilderType}.Build({optionsVariable}, new {BearerAuthenticationPolicyType}({credentialVariable}, {new CodeWriterDeclaration(scopesParamName)}));";
        public override FormattableString GetHttpPipelineClassifierString(string pipelineField, string optionsVariable, FormattableString perCallPolicies, FormattableString perRetryPolicies)
            => $"{pipelineField:I} = {typeof(object)}.name({optionsVariable:I}, {perRetryPolicies}, {perCallPolicies});";

        public override Type HttpPipelinePolicyType => typeof(object);

        public override string HttpMessageRequestName => "PipelineMessage";

        public override FormattableString GetSetMethodString(string requestName, string method)
        {
            return $"{requestName}.PipelineRequest.SetMethod(\"{method}\");";
        }

        private string GetHttpMethodName(string method)
        {
            return $"{method[0]}{method.Substring(1).ToLowerInvariant()}";
        }

        public override FormattableString GetSetUriString(string requestName, string uriName)
            => $"{requestName}.Uri = {uriName}.requestUri();";

        public override FormattableString GetSetContentString(string requestName, string contentName)
            => $"{requestName}.Content = {contentName};";

        public override Type RequestUriType => typeof(Uri);
        public override Type RequestContentType => typeof(object);
        public override string CancellationTokenName => nameof(CancellationToken);
        public override string ToRequestContentName => "ToRequestBody";
        public override string RequestContentCreateName => "Create";

        public override Type IUtf8JsonSerializableType => typeof(object);

        public override Type IXmlSerializableType => throw new NotSupportedException("Xml serialization is not supported in non-branded libraries yet");
        public override string IUtf8JsonSerializableWriteName => "IUtf8JsonWriteable.Write";

        public override Type Utf8JsonWriterExtensionsType => typeof(object);
        public override string Utf8JsonWriterExtensionsWriteObjectValueName => "ModelSerializationExtensions.WriteObjectValue";
        public override string Utf8JsonWriterExtensionsWriteNumberValueName => "ModelSerializationExtensions.WriteNumberValue";
        public override string Utf8JsonWriterExtensionsWriteStringValueName => "ModelSerializationExtensions.WriteStringValue";
        public override string Utf8JsonWriterExtensionsWriteBase64StringValueName => "ModelSerializationExtensions.WriteBase64StringValue";

        public override Type OptionalType => typeof(object);
        public override Type OptionalPropertyType => typeof(object);

        public override string OptionalIsCollectionDefinedName => "OptionalProperty.IsCollectionDefined";
        public override string OptionalIsDefinedName => "OptionalProperty.IsDefined";
        public override string OptionalToDictionaryName => "OptionalProperty.ToDictionary";
        public override string OptionalToListName => "OptionalProperty.ToList";
        public override string OptionalToNullableName => "OptionalProperty.ToNullable";

        public override Type RequestFailedExceptionType => typeof(object);

        public override string ResponseClassifierIsErrorResponseName => "ResponseErrorClassifier.IsErrorResponse";

        public override Type ResponseClassifierType => typeof(object);
        public override Type StatusCodeClassifierType => typeof(object);

        public override ValueExpression GetCreateFromStreamSampleExpression(ValueExpression freeFormObjectExpression)
            => new InvokeStaticMethodExpression(TestPlugin.Instance.Configuration.ApiTypes.RequestContentType, TestPlugin.Instance.Configuration.ApiTypes.RequestContentCreateName, new[] { BinaryDataExpression.FromObjectAsJson(freeFormObjectExpression).ToStream() });

        public override string EndPointSampleValue => "https://my-service.com";

        public override string JsonElementVariableName => "element";

        public override ValueExpression GetKeySampleExpression(string clientName)
            => new InvokeStaticMethodExpression(typeof(Environment), nameof(Environment.GetEnvironmentVariable), new[] { new StringLiteralExpression($"{clientName}_KEY", false) });
    }
}
