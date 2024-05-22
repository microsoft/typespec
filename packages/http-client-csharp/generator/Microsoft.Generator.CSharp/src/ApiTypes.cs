// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ComponentModel.Composition;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp
{
    /// <summary>
    /// ApiTypes represent the API types used in the generated code.
    /// </summary>
    [InheritedExport]
    public abstract class ApiTypes
    {
        /// <summary>
        /// The type for change tracking lists.
        /// </summary>
        public abstract Type ChangeTrackingListType { get; }
        /// <summary>
        /// The type for change tracking dictionaries.
        /// </summary>
        public abstract Type ChangeTrackingDictionaryType { get; }

        /// <summary>
        ///  The sample value for the endpoint.
        /// </summary>
        public abstract string EndPointSampleValue { get; }

        // TO-DO: Refactor this to use overridable properties in expression / statements: https://github.com/Azure/autorest.csharp/issues/4226
        public abstract Type ResponseType { get; }
        public abstract Type ResponseOfTType { get; }

        public string FromResponseName => "FromResponse";
        public abstract string ResponseParameterName { get; }
        public abstract string ContentStreamName { get; }
        public abstract string StatusName { get; }

        public abstract string GetRawResponseName { get; }

        public Type GetResponseOfT<T>() => ResponseOfTType.MakeGenericType(typeof(T));
        public Type GetTaskOfResponse(Type? valueType = default) =>
            valueType is null ? typeof(Task<>).MakeGenericType(ResponseType) : typeof(Task<>).MakeGenericType(ResponseOfTType.MakeGenericType(valueType));
        public Type GetValueTaskOfResponse(Type? valueType = default) =>
            valueType is null ? typeof(ValueTask<>).MakeGenericType(ResponseType) : typeof(ValueTask<>).MakeGenericType(ResponseOfTType.MakeGenericType(valueType));

        public abstract Type HttpPipelineType { get; }
        public abstract Type PipelineExtensionsType { get; }
        public abstract string HttpPipelineCreateMessageName { get; }
        public FormattableString GetHttpPipelineCreateMessageFormat(bool withContext)
        {
            FormattableString context = withContext ? (FormattableString)$"{KnownParameters.RequestContext.Name:I}" : $"";
            return $"_pipeline.{CodeModelPlugin.Instance.Configuration.ApiTypes.HttpPipelineCreateMessageName}({context}";
        }

        public abstract Type HttpMessageType { get; }
        public abstract string HttpMessageResponseName { get; }
        public abstract string HttpMessageResponseStatusName { get; }

        public Type GetNextPageFuncType() => typeof(Func<,,>).MakeGenericType(typeof(int?), typeof(string), HttpMessageType);

        public abstract Type ClientDiagnosticsType { get; }
        public abstract string ClientDiagnosticsCreateScopeName { get; }

        public abstract Type ClientOptionsType { get; }

        public abstract Type RequestContextType { get; }
        public abstract string CancellationTokenName { get; }

        public abstract Type HttpPipelineBuilderType { get; }
        public abstract Type BearerAuthenticationPolicyType { get; }
        public abstract Type KeyCredentialPolicyType { get; }
        public abstract Type KeyCredentialType { get; }
        public abstract FormattableString GetHttpPipelineBearerString(string pipelineField, string optionsVariable, string credentialVariable, string scopesParamName);
        public FormattableString GetHttpPipelineKeyCredentialString(string pipelineField, string optionsVariable, string credentialVariable, string keyName)
            => $"{pipelineField} = {HttpPipelineBuilderType}.Build({optionsVariable}, new {KeyCredentialPolicyType}({credentialVariable}, \"{keyName}\"));";
        public abstract FormattableString GetHttpPipelineClassifierString(string pipelineField, string optionsVariable, FormattableString perCallPolicies, FormattableString perRetryPolicies);

        public abstract Type HttpPipelinePolicyType { get; }
        public abstract string HttpMessageRequestName { get; }

        public abstract FormattableString GetSetMethodString(string requestName, string method);
        public abstract FormattableString GetSetUriString(string requestName, string uriName);

        // TO-DO: migrate as part of autorest output types migration: https://github.com/Azure/autorest.csharp/issues/4198
        // public abstract Action<CodeWriter, CodeWriterDeclaration, RequestHeader, ClientFields?> WriteHeaderMethod { get; }

        public abstract FormattableString GetSetContentString(string requestName, string contentName);
        public abstract Type RequestUriType { get; }
        public abstract Type RequestContentType { get; }
        public abstract string ToRequestContentName { get; }
        public abstract string RequestContentCreateName { get; }

        public abstract Type IUtf8JsonSerializableType { get; }
        public abstract Type IXmlSerializableType { get; }
        public abstract string IUtf8JsonSerializableWriteName { get; }

        public abstract Type Utf8JsonWriterExtensionsType { get; }
        public abstract string Utf8JsonWriterExtensionsWriteObjectValueName { get; }
        public abstract string Utf8JsonWriterExtensionsWriteNumberValueName { get; }
        public abstract string Utf8JsonWriterExtensionsWriteStringValueName { get; }
        public abstract string Utf8JsonWriterExtensionsWriteBase64StringValueName { get; }

        public abstract Type OptionalType { get; }
        public abstract Type OptionalPropertyType { get; }

        public abstract string OptionalIsCollectionDefinedName { get; }
        public abstract string OptionalIsDefinedName { get; }
        public abstract string OptionalToDictionaryName { get; }
        public abstract string OptionalToListName { get; }
        public abstract string OptionalToNullableName { get; }

        public abstract Type RequestFailedExceptionType { get; }

        public abstract string ResponseClassifierIsErrorResponseName { get; }

        public abstract string JsonElementVariableName { get; }
        public abstract Type ResponseClassifierType { get; }
        public abstract Type StatusCodeClassifierType { get; }
        public abstract ValueExpression GetCreateFromStreamSampleExpression(ValueExpression freeFormObjectExpression);

        public abstract ValueExpression GetKeySampleExpression(string clientName);
    }
}
