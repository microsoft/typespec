// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using Autorest.CSharp.Core;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Models.Types;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Requests;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Output.Models.Types;
using Azure.Core;

namespace AutoRest.CSharp.Generation.Writers
{
    internal static class PageableMethodsWriterExtensions
    {
        private static readonly CSharpType BinaryDataType = typeof(BinaryData);

        public static CodeWriter WriteLongRunningPageable(this CodeWriter writer, MethodSignature methodSignature, CSharpType? pageItemType, Reference? restClientReference, RestClientMethod createLroRequestMethod, RestClientMethod? createNextPageRequestMethod, Reference clientDiagnosticsReference, Reference pipelineReference, Diagnostic diagnostic, OperationFinalStateVia finalStateVia, string? itemPropertyName, string? nextLinkPropertyName, bool async)
        {
            using (writer.WriteMethodDeclaration(methodSignature.WithAsync(async)))
            {
                writer.WriteParametersValidation(methodSignature.Parameters);
                using (writer.WriteDiagnosticScope(diagnostic, clientDiagnosticsReference))
                {
                    var messageVariable = new CodeWriterDeclaration("message");
                    var nextPageRequest = GetCreateRequestCall(restClientReference, createNextPageRequestMethod);
                    var nextPageRequestVariable = nextPageRequest != null ? new CodeWriterDeclaration("NextPageRequest") : null;
                    var parameters = methodSignature.Parameters.ToList();
                    writer.EnsureRequestContextVariable(parameters, null, createNextPageRequestMethod);

                    var createPageableParameters = new List<FormattableString>
                    {
                        $"{KnownParameters.WaitForCompletion.Name}",
                        $"{messageVariable:I}",
                        nextPageRequest != null ? $"{nextPageRequestVariable:I}" : (FormattableString)$"null",
                        GetValueFactory(pageItemType),
                        clientDiagnosticsReference.GetReferenceFormattable(),
                        pipelineReference.GetReferenceFormattable(),
                        $"{typeof(OperationFinalStateVia)}.{finalStateVia}"
                    };

                    createPageableParameters.AddTrailingPageableParameters(parameters, diagnostic.ScopeName, itemPropertyName, nextLinkPropertyName);

                    if (nextPageRequestVariable != null)
                    {
                        writer.Line($"{Configuration.ApiTypes.HttpMessageType} {nextPageRequestVariable:D}({KnownParameters.PageSizeHint.Type} {KnownParameters.PageSizeHint.Name}, {KnownParameters.NextLink.Type} {KnownParameters.NextLink.Name}) => {nextPageRequest};");
                    }

                    writer.Line($"using {Configuration.ApiTypes.HttpMessageType} {messageVariable:D} = {RequestWriterHelpers.CreateRequestMethodName(createLroRequestMethod.Name)}({createLroRequestMethod.Parameters.GetIdentifiersFormattable()});");

                    if (async)
                    {
                        writer.Line($"return await {typeof(GeneratorPageableHelpers)}.{nameof(GeneratorPageableHelpers.CreateAsyncPageable)}({createPageableParameters.Join(", ")}).ConfigureAwait(false);");
                    }
                    else
                    {
                        writer.Line($"return {typeof(GeneratorPageableHelpers)}.{nameof(GeneratorPageableHelpers.CreatePageable)}({createPageableParameters.Join(", ")});");
                    }
                }
            }

            return writer.Line();
        }

        public static CodeWriter WritePageable(this CodeWriter writer, ConvenienceMethod convenienceMethod, RestClientMethod? createFirstPageRequestMethod, RestClientMethod? createNextPageRequestMethod, Reference clientDiagnosticsReference, Reference pipelineReference, string scopeName, string? itemPropertyName, string? nextLinkPropertyName, bool async)
        {
            using (writer.WriteMethodDeclaration(convenienceMethod.Signature.WithAsync(async)))
            {
                writer.WriteParametersValidation(convenienceMethod.Signature.Parameters);

                var firstPageRequest = GetCreateRequestCall(null, createFirstPageRequestMethod, convenienceMethod.ProtocolToConvenienceParameterConverters);
                var nextPageRequest = GetCreateRequestCall(null, createNextPageRequestMethod, convenienceMethod.ProtocolToConvenienceParameterConverters);
                var parameters = new List<Parameter>();

                foreach ((Parameter protocolParameter, Parameter? convenienceParameter, _) in convenienceMethod.ProtocolToConvenienceParameterConverters)
                {
                    if (protocolParameter.Type.EqualsIgnoreNullable(Configuration.ApiTypes.RequestContentType) &&
                        convenienceParameter is { Name: var fromName, Type: { IsFrameworkType: false, Implementation: ModelTypeProvider }, IsOptionalInSignature: var isOptional })
                    {
                        writer
                            .Append($"{protocolParameter.Type} {protocolParameter.Name:D} = {fromName:I}")
                            .AppendRawIf(".", isOptional)
                            .Line($".ToRequestContent();");
                    }
                    else if (convenienceParameter is not null)
                    {
                        parameters.Add(convenienceParameter);
                    }
                }

                writer.EnsureRequestContextVariable(parameters, createFirstPageRequestMethod, createNextPageRequestMethod);
                writer.WritePageableBody(parameters, convenienceMethod.ResponseType, firstPageRequest, nextPageRequest, clientDiagnosticsReference, pipelineReference, scopeName, itemPropertyName, nextLinkPropertyName, async);
            }

            return writer.Line();
        }

        public static CodeWriter WritePageable(this CodeWriter writer, MethodSignature methodSignature, CSharpType? pageItemType, Reference? restClientReference, RestClientMethod? createFirstPageRequestMethod, RestClientMethod? createNextPageRequestMethod, Reference clientDiagnosticsReference, Reference pipelineReference, string scopeName, string? itemPropertyName, string? nextLinkPropertyName, bool async)
        {
            using (writer.WriteMethodDeclaration(methodSignature.WithAsync(async)))
            {
                writer.WriteParametersValidation(methodSignature.Parameters);
                var parameters = methodSignature.Parameters.ToList();
                var firstPageRequest = GetCreateRequestCall(restClientReference, createFirstPageRequestMethod);
                var nextPageRequest = GetCreateRequestCall(restClientReference, createNextPageRequestMethod);

                writer.EnsureRequestContextVariable(parameters, createFirstPageRequestMethod, createNextPageRequestMethod);
                writer.WritePageableBody(parameters, pageItemType, firstPageRequest, nextPageRequest, clientDiagnosticsReference, pipelineReference, scopeName, itemPropertyName, nextLinkPropertyName, async);
            }

            return writer.Line();
        }

        public static CodeWriter WritePageableBody(this CodeWriter writer, IReadOnlyList<Parameter> methodParameters, CSharpType? pageItemType, FormattableString? firstPageRequest, FormattableString? nextPageRequest, Reference clientDiagnosticsReference, Reference pipelineReference, string scopeName, string? itemPropertyName, string? nextLinkPropertyName, bool async)
        {
            var firstPageRequestVariable = firstPageRequest != null ? new CodeWriterDeclaration("FirstPageRequest") : null;
            var nextPageRequestVariable = nextPageRequest != null ? new CodeWriterDeclaration("NextPageRequest") : null;
            List<FormattableString> createPageableParameters = new()
            {
                firstPageRequest != null ? $"{firstPageRequestVariable:I}" : (FormattableString)$"null",
                nextPageRequest != null ? $"{nextPageRequestVariable:I}" : (FormattableString)$"null",
                GetValueFactory(pageItemType),
                clientDiagnosticsReference.GetReferenceFormattable(),
                pipelineReference.GetReferenceFormattable()
            };

            createPageableParameters.AddTrailingPageableParameters(methodParameters, scopeName, itemPropertyName, nextLinkPropertyName);

            if (firstPageRequestVariable != null)
            {
                writer.Line($"{Configuration.ApiTypes.HttpMessageType} {firstPageRequestVariable:D}({KnownParameters.PageSizeHint.Type} {KnownParameters.PageSizeHint.Name}) => {firstPageRequest};");
            }

            if (nextPageRequestVariable != null)
            {
                writer.Line($"{Configuration.ApiTypes.HttpMessageType} {nextPageRequestVariable:D}({KnownParameters.PageSizeHint.Type} {KnownParameters.PageSizeHint.Name}, {KnownParameters.NextLink.Type} {KnownParameters.NextLink.Name}) => {nextPageRequest};");
            }

            return writer.Line($"return {typeof(GeneratorPageableHelpers)}.{(async ? nameof(GeneratorPageableHelpers.CreateAsyncPageable) : nameof(GeneratorPageableHelpers.CreatePageable))}({createPageableParameters.Join(", ")});");
        }

        private static void AddTrailingPageableParameters(this List<FormattableString> createPageableParameters, IReadOnlyCollection<Parameter> methodParameters, string scopeName, string? itemPropertyName, string? nextLinkPropertyName)
        {
            createPageableParameters.Add($"{scopeName:L}");
            createPageableParameters.Add($"{itemPropertyName:L}");
            createPageableParameters.Add($"{nextLinkPropertyName:L}");

            if (ContainsRequestContext(methodParameters))
            {
                createPageableParameters.Add($"{KnownParameters.RequestContext.Name:I}");
            }
            else if (methodParameters.Contains(KnownParameters.CancellationTokenParameter))
            {
                createPageableParameters.Add($"{KnownParameters.CancellationTokenParameter.Name:I}");
            }
        }

        private static void EnsureRequestContextVariable(this CodeWriter writer, List<Parameter> parameters, RestClientMethod? createFirstPageRequestMethod, RestClientMethod? createNextPageRequestMethod)
        {
            if (ContainsRequestContext(parameters))
            {
                return;
            }

            if (!ContainsRequestContext(createFirstPageRequestMethod?.Parameters) && !ContainsRequestContext(createNextPageRequestMethod?.Parameters))
            {
                return;
            }

            var requestContextVariable = new CodeWriterDeclaration(KnownParameters.RequestContext.Name);
            if (parameters.Contains(KnownParameters.CancellationTokenParameter))
            {
                writer.Line($"{KnownParameters.RequestContext.Type} {requestContextVariable:D} = {KnownParameters.CancellationTokenParameter.Name:I}.{nameof(CancellationToken.CanBeCanceled)} ? new {KnownParameters.RequestContext.Type} {{ {Configuration.ApiTypes.CancellationTokenName} = {KnownParameters.CancellationTokenParameter.Name:I} }} : null;");
            }
            else
            {
                writer.Line($"{KnownParameters.RequestContext.Type} {requestContextVariable:D} = null;");
            }

            parameters.Add(KnownParameters.RequestContext);

        }

        private static bool ContainsRequestContext(IReadOnlyCollection<Parameter>? parameters) =>
            parameters != null && (parameters.Contains(KnownParameters.RequestContext) || parameters.Contains(KnownParameters.RequestContextRequired));

        private static FormattableString? GetCreateRequestCall(Reference? restClientReference, RestClientMethod? createRequestMethod, IReadOnlyList<ProtocolToConvenienceParameterConverter>? ProtocolToConvenienceParameterConverters = null)
        {
            if (createRequestMethod == null)
            {
                return null;
            }

            var methodName = RequestWriterHelpers.CreateRequestMethodName(createRequestMethod);
            if (restClientReference != null)
            {
                return $"{restClientReference.Value.GetReferenceFormattable()}.{methodName}({createRequestMethod.Parameters.GetIdentifiersFormattable()})";
            }

            if (ProtocolToConvenienceParameterConverters == null)
            {
                return $"{methodName}({createRequestMethod.Parameters.GetIdentifiersFormattable()})";
            }

            var parameters = new List<FormattableString>();
            foreach (var parameter in createRequestMethod.Parameters)
            {
                if (parameter == KnownParameters.RequestContext || parameter == KnownParameters.RequestContextRequired || parameter.Name == "nextLink" || parameter.Type.EqualsIgnoreNullable(Configuration.ApiTypes.RequestContentType))
                {
                    parameters.Add($"{parameter.Name}");
                    continue;
                }

                var convenienceParameter = ProtocolToConvenienceParameterConverters.FirstOrDefault(convert => convert.Convenience.Name == parameter.Name)?.Convenience;
                if (convenienceParameter == null)
                {
                    throw new InvalidOperationException($"Cannot find corresponding convenience parameter for create request method parameter {parameter.Name}.");
                }

                parameters.Add(convenienceParameter.GetConversionFormattable(parameter.Type, null));
            }
            return $"{methodName}({parameters.Join(" ,")})";
        }

        private static FormattableString GetValueFactory(CSharpType? pageItemType)
        {
            if (pageItemType is null)
            {
                throw new NotSupportedException("Type of the element of the page must be specified");
            }

            if (pageItemType.Equals(BinaryDataType))
            {
                // When `JsonElement` provides access to its UTF8 buffer, change this code to create `BinaryData` from it.
                // See also GeneratorPageableHelpers.ParseResponseForBinaryData
                return $"e => {BinaryDataType}.{nameof(BinaryData.FromString)}(e.{nameof(JsonElement.GetRawText)}())";
            }

            if (!pageItemType.IsFrameworkType && pageItemType.Implementation is SerializableObjectType { JsonSerialization: { } } type)
            {
                // TODO -- we no longer need this once we remove the UseModelReaderWriter flag
                if (Configuration.UseModelReaderWriter)
                    return $"e => {type.Type}.Deserialize{type.Declaration.Name}(e)";
                else
                    return $"{type.Type}.Deserialize{type.Declaration.Name}";
            }

            var deserializeImplementation = JsonCodeWriterExtensions.GetDeserializeValueFormattable($"e", pageItemType);
            return $"e => {deserializeImplementation}";
        }
    }
}
