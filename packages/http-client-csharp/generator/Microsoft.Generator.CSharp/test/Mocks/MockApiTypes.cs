using System;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Tests
{
    public class MockApiTypes : ApiTypes
    {
        public override string EndPointSampleValue { get; } = null!;
        public override Type ResponseType { get; } = null!;
        public override Type ResponseOfTType { get; } = null!;
        public override string ResponseParameterName { get; } = null!;
        public override string ContentStreamName { get; } = null!;
        public override string StatusName { get; } = null!;
        public override string GetRawResponseName { get; } = null!;
        public override Type HttpPipelineType { get; } = null!;
        public override string HttpPipelineCreateMessageName { get; } = null!;
        public override Type HttpMessageType { get; } = null!;
        public override string HttpMessageResponseName { get; } = null!;
        public override string HttpMessageResponseStatusName { get; } = null!;
        public override Type ClientOptionsType { get; } = null!;
        public override Type RequestContextType { get; } = null!;
        public override string CancellationTokenName { get; } = null!;
        public override Type HttpPipelineBuilderType { get; } = null!;
        public override Type BearerAuthenticationPolicyType { get; } = null!;
        public override Type KeyCredentialPolicyType { get; } = null!;
        public override Type KeyCredentialType { get; } = null!;

        public override FormattableString GetHttpPipelineBearerString(string pipelineField,
            string optionsVariable,
            string credentialVariable,
            string scopesParamName)
        {
            throw new NotImplementedException();
        }

        public override FormattableString GetHttpPipelineClassifierString(string pipelineField,
            string optionsVariable,
            FormattableString perCallPolicies,
            FormattableString perRetryPolicies,
            FormattableString beforeTransportPolicies)
        {
            throw new NotImplementedException();
        }

        public override Type HttpPipelinePolicyType { get; } = null!;
        public override string HttpMessageRequestName { get; } = null!;
        public override FormattableString GetSetMethodString(string requestName, string method)
        {
            throw new NotImplementedException();
        }

        public override FormattableString GetSetUriString(string requestName, string uriName)
        {
            throw new NotImplementedException();
        }

        public override FormattableString GetSetContentString(string requestName, string contentName)
        {
            throw new NotImplementedException();
        }

        public override Type RequestContentType { get; } = null!;
        public override string ToRequestContentName { get; } = null!;
        public override string RequestContentCreateName { get; } = null!;
        public override Type IXmlSerializableType { get; } = null!;
        public override Type RequestFailedExceptionType { get; } = null!;
        public override string ResponseClassifierIsErrorResponseName { get; } = null!;
        public override string JsonElementVariableName { get; } = null!;
        public override Type ResponseClassifierType { get; } = null!;
        public override Type StatusCodeClassifierType { get; } = null!;
        public override ValueExpression GetCreateFromStreamSampleExpression(ValueExpression freeFormObjectExpression)
        {
            throw new NotImplementedException();
        }

        public override ValueExpression GetKeySampleExpression(string clientName)
        {
            throw new NotImplementedException();
        }
    }
}
