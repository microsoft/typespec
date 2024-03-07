// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoRest.CSharp.Common.Generation.Writers;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Requests;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Output.Models.Types;
using Azure;
using Azure.Core;

namespace AutoRest.CSharp.Generation.Writers
{
    internal class DataPlaneClientWriter : ClientWriter
    {
        public void WriteClient(CodeWriter writer, DataPlaneClient client, DataPlaneOutputLibrary library)
        {
            var cs = client.Type;
            var @namespace = cs.Namespace;
            using (writer.Namespace(@namespace))
            {
                writer.WriteXmlDocumentationSummary($"{client.Description}");
                using (writer.Scope($"{client.Declaration.Accessibility} partial class {cs.Name}"))
                {
                    WriteClientFields(writer, client.RestClient, true);
                    WriteClientCtors(writer, client, library);

                    foreach (var clientMethod in client.Methods)
                    {
                        WriteClientMethod(writer, clientMethod, true);
                        WriteClientMethod(writer, clientMethod, false);
                    }

                    foreach (var pagingMethod in client.PagingMethods)
                    {
                        WritePagingOperation(writer, client, pagingMethod, true);
                        WritePagingOperation(writer, client, pagingMethod, false);
                    }

                    foreach (var longRunningOperation in client.LongRunningOperationMethods)
                    {
                        WriteStartOperationOperation(writer, longRunningOperation, true);
                        WriteStartOperationOperation(writer, longRunningOperation, false);
                    }
                }
            }
        }

        private void WriteClientMethod(CodeWriter writer, ClientMethod clientMethod, bool async)
        {
            CSharpType? bodyType = clientMethod.RestClientMethod.ReturnType;
            CSharpType responseType = bodyType != null ?
                new CSharpType(Configuration.ApiTypes.ResponseOfTType, bodyType) :
                Configuration.ApiTypes.ResponseType;

            responseType = async ? new CSharpType(typeof(Task<>), responseType) : responseType;

            var parameters = clientMethod.RestClientMethod.Parameters;
            writer.WriteXmlDocumentationSummary($"{clientMethod.RestClientMethod.SummaryText}");

            foreach (Parameter parameter in parameters)
            {
                writer.WriteXmlDocumentationParameter(parameter.Name, $"{parameter.Description}");
            }

            writer.WriteXmlDocumentationParameter("cancellationToken", $"The cancellation token to use.");
            writer.WriteXmlDocumentation("remarks", $"{clientMethod.RestClientMethod.DescriptionText}");

            var methodName = CreateMethodName(clientMethod.Name, async);
            var asyncText = async ? "async" : string.Empty;
            writer.Append($"{clientMethod.Accessibility} virtual {asyncText} {responseType} {methodName}(");

            foreach (Parameter parameter in parameters)
            {
                writer.WriteParameter(parameter);
            }
            writer.Line($"{typeof(CancellationToken)} cancellationToken = default)");

            using (writer.Scope())
            {
                using (writer.WriteDiagnosticScope(clientMethod.Diagnostics, ClientDiagnosticsField))
                {
                    writer.Append($"return (");
                    if (async)
                    {
                        writer.Append($"await ");
                    }

                    writer.Append($"RestClient.{CreateMethodName(clientMethod.RestClientMethod.Name, async)}(");
                    foreach (var parameter in clientMethod.RestClientMethod.Parameters)
                    {
                        writer.Append($"{parameter.Name:I}, ");
                    }
                    writer.Append($"cancellationToken)");

                    if (async)
                    {
                        writer.Append($".ConfigureAwait(false)");
                    }

                    writer.Append($")");

                    if (bodyType == null && clientMethod.RestClientMethod.HeaderModel != null)
                    {
                        writer.Append($".{Configuration.ApiTypes.GetRawResponseName}()");
                    }

                    writer.Line($";");
                }
            }

            writer.Line();
        }

        private string CreateStartOperationName(string name, bool async) => $"Start{name}{(async ? "Async" : string.Empty)}";

        private const string EndpointVariable = "endpoint";
        private const string CredentialVariable = "credential";
        private const string OptionsVariable = "options";

        private void WriteClientCtors(CodeWriter writer, DataPlaneClient client, DataPlaneOutputLibrary library)
        {
            writer.Line();
            writer.WriteXmlDocumentationSummary($"Initializes a new instance of {client.Type.Name} for mocking.");
            using (writer.Scope($"protected {client.Type.Name:D}()"))
            {
            }
            writer.Line();

            var clientOptionsName = library.ClientOptions!.Declaration.Name;

            if (library.Authentication.ApiKey != null)
            {
                var ctorParams = client.GetClientConstructorParameters(Configuration.ApiTypes.KeyCredentialType);
                writer.WriteXmlDocumentationSummary($"Initializes a new instance of {client.Type.Name}");
                foreach (Parameter parameter in ctorParams)
                {
                    writer.WriteXmlDocumentationParameter(parameter.Name, $"{parameter.Description}");
                }
                writer.WriteXmlDocumentationParameter(OptionsVariable, $"The options for configuring the client.");

                writer.Append($"public {client.Type.Name:D}(");
                foreach (Parameter parameter in ctorParams)
                {
                    writer.WriteParameter(parameter);
                }
                writer.Append($" {clientOptionsName} {OptionsVariable} = null)");

                using (writer.Scope())
                {
                    writer.WriteParameterNullChecks(ctorParams);
                    writer.Line();

                    writer.Line($"{OptionsVariable} ??= new {clientOptionsName}();");
                    writer.Line($"{ClientDiagnosticsField.GetReferenceFormattable()} = new {Configuration.ApiTypes.ClientDiagnosticsType}({OptionsVariable});");
                    writer.Line(Configuration.ApiTypes.GetHttpPipelineKeyCredentialString(PipelineField, OptionsVariable, CredentialVariable, library.Authentication.ApiKey.Name));
                    writer.Append($"this.RestClient = new {client.RestClient.Type}(");
                    foreach (var parameter in client.RestClient.Parameters)
                    {
                        if (parameter.IsApiVersionParameter)
                        {
                            writer.Append($"{OptionsVariable}.Version, ");
                        }
                        else if (parameter == KnownParameters.ClientDiagnostics)
                        {
                            writer.Append($"{ClientDiagnosticsField.GetReferenceFormattable()}, ");
                        }
                        else if (parameter == KnownParameters.Pipeline)
                        {
                            writer.Append($"{PipelineField}, ");
                        }
                        else
                        {
                            writer.Append($"{parameter.Name}, ");
                        }
                    }
                    writer.RemoveTrailingComma();
                    writer.Append($");");
                }
                writer.Line();
            }

            if (library.Authentication.OAuth2 != null)
            {
                var ctorParams = client.GetClientConstructorParameters(typeof(TokenCredential));
                writer.WriteXmlDocumentationSummary($"Initializes a new instance of {client.Type.Name}");
                foreach (Parameter parameter in ctorParams)
                {
                    writer.WriteXmlDocumentationParameter(parameter.Name, $"{parameter.Description}");
                }
                writer.WriteXmlDocumentationParameter(OptionsVariable, $"The options for configuring the client.");

                writer.Append($"public {client.Type.Name:D}(");
                foreach (Parameter parameter in ctorParams)
                {
                    writer.WriteParameter(parameter);
                }
                writer.Append($" {clientOptionsName} {OptionsVariable} = null)");

                using (writer.Scope())
                {
                    writer.WriteParameterNullChecks(ctorParams);
                    writer.Line();

                    writer.Line($"{OptionsVariable} ??= new {clientOptionsName}();");
                    writer.Line($"{ClientDiagnosticsField.GetReferenceFormattable()} = new {Configuration.ApiTypes.ClientDiagnosticsType}({OptionsVariable});");
                    var scopesParam = new CodeWriterDeclaration("scopes");
                    writer.Append($"string[] {scopesParam:D} = ");
                    writer.Append($"{{ ");
                    foreach (var credentialScope in library.Authentication.OAuth2.Scopes)
                    {
                        writer.Append($"{credentialScope:L}, ");
                    }
                    writer.RemoveTrailingComma();
                    writer.Line($"}};");

                    writer.Line(Configuration.ApiTypes.GetHttpPipelineBearerString(PipelineField, OptionsVariable, CredentialVariable, scopesParam));
                    writer.Append($"this.RestClient = new {client.RestClient.Type}(");
                    foreach (var parameter in client.RestClient.Parameters)
                    {
                        if (parameter.IsApiVersionParameter)
                        {
                            writer.Append($"{OptionsVariable}.Version, ");
                        }
                        else if (parameter == KnownParameters.ClientDiagnostics)
                        {
                            writer.Append($"{ClientDiagnosticsField.GetReferenceFormattable()}, ");
                        }
                        else if (parameter == KnownParameters.Pipeline)
                        {
                            writer.Append($"{PipelineField}, ");
                        }
                        else
                        {
                            writer.Append($"{parameter.Name}, ");
                        }
                    }
                    writer.RemoveTrailingComma();
                    writer.Append($");");
                }
                writer.Line();
            }

            var internalConstructor = BuildInternalConstructor(client);
            writer.WriteMethodDocumentation(internalConstructor);
            using (writer.WriteMethodDeclaration(internalConstructor))
            {
                writer
                    .Line($"this.RestClient = new {client.RestClient.Type}({client.RestClient.Parameters.GetIdentifiersFormattable()});")
                    .Line($"{ClientDiagnosticsField.GetReferenceFormattable()} = {KnownParameters.ClientDiagnostics.Name:I};")
                    .Line($"{PipelineField} = {KnownParameters.Pipeline.Name:I};");
            }
            writer.Line();
        }

        private void WritePagingOperation(CodeWriter writer, DataPlaneClient client, PagingMethod pagingMethod, bool async)
        {
            var pageType = pagingMethod.PagingResponse.ItemType;
            var parameters = pagingMethod.Method.Parameters
                .Where(p => p.Name != KnownParameters.RequestContext.Name)
                .Append(KnownParameters.CancellationTokenParameter)
                .ToList();

            var pipelineReference = new Reference(PipelineField, Configuration.ApiTypes.HttpPipelineType);
            var scopeName = pagingMethod.Diagnostics.ScopeName;
            var nextLinkName = pagingMethod.PagingResponse.NextLinkPropertyName;
            var itemName = pagingMethod.PagingResponse.ItemPropertyName;
            var signature = new MethodSignature(
                pagingMethod.Name,
                $"{pagingMethod.Method.SummaryText}",
                $"{pagingMethod.Method.DescriptionText}",
                MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual,
                new CSharpType(typeof(Pageable<>), pageType),
                null,
                parameters);

            writer.WriteXmlDocumentationSummary($"{pagingMethod.Method.SummaryText}");

            foreach (Parameter parameter in parameters)
            {
                writer.WriteXmlDocumentationParameter(parameter.Name, $"{parameter.Description}");
            }

            writer.WriteXmlDocumentationRequiredParametersException(parameters);
            writer.WriteXmlDocumentation("remarks", $"{pagingMethod.Method.DescriptionText}");
            writer.WritePageable(signature, pageType, new Reference(RestClientField, client.RestClient.Type), pagingMethod.Method, pagingMethod.NextPageMethod, ClientDiagnosticsField, pipelineReference, scopeName, itemName, nextLinkName, async);
        }

        private void WriteStartOperationOperation(CodeWriter writer, LongRunningOperationMethod lroMethod, bool async)
        {
            RestClientMethod originalMethod = lroMethod.StartMethod;
            CSharpType returnType = async ? new CSharpType(typeof(Task<>), lroMethod.Operation.Type) : lroMethod.Operation.Type;
            var parameters = originalMethod.Parameters;

            writer.WriteXmlDocumentationSummary($"{originalMethod.SummaryText}");

            foreach (Parameter parameter in parameters)
            {
                writer.WriteXmlDocumentationParameter(parameter.Name, $"{parameter.Description}");
            }
            writer.WriteXmlDocumentationParameter("cancellationToken", $"The cancellation token to use.");
            writer.WriteXmlDocumentationRequiredParametersException(parameters);
            writer.WriteXmlDocumentation("remarks", $"{originalMethod.DescriptionText}");

            string asyncText = async ? "async " : string.Empty;
            writer.Append($"{lroMethod.Accessibility} virtual {asyncText}{returnType} {CreateStartOperationName(lroMethod.Name, async)}(");
            foreach (Parameter parameter in parameters)
            {
                writer.WriteParameter(parameter);
            }
            writer.Line($"{typeof(CancellationToken)} cancellationToken = default)");

            using (writer.Scope())
            {
                writer.WriteParameterNullChecks(parameters);

                using (writer.WriteDiagnosticScope(lroMethod.Diagnostics, ClientDiagnosticsField))
                {
                    string awaitText = async ? "await" : string.Empty;
                    string configureText = async ? ".ConfigureAwait(false)" : string.Empty;
                    writer.Append($"var originalResponse = {awaitText} RestClient.{CreateMethodName(originalMethod.Name, async)}(");
                    foreach (Parameter parameter in parameters)
                    {
                        writer.Append($"{parameter.Name}, ");
                    }

                    writer.Line($"cancellationToken){configureText};");

                    writer.Append($"return new {lroMethod.Operation.Type}({ClientDiagnosticsField.GetReferenceFormattable()}, {PipelineField}, RestClient.{RequestWriterHelpers.CreateRequestMethodName(originalMethod.Name)}(");
                    foreach (Parameter parameter in parameters)
                    {
                        writer.Append($"{parameter.Name}, ");
                    }
                    writer.RemoveTrailingComma();
                    writer.Append($").{Configuration.ApiTypes.HttpMessageRequestName}, originalResponse");

                    var nextPageMethod = lroMethod.Operation.NextPageMethod;
                    if (nextPageMethod != null)
                    {
                        writer.Append($", (_, nextLink) => RestClient.{RequestWriterHelpers.CreateRequestMethodName(nextPageMethod)}(nextLink, {parameters.GetIdentifiersFormattable()})");
                    }

                    writer.Line($");");
                }

            }
            writer.Line();
        }

        private static ConstructorSignature BuildInternalConstructor(DataPlaneClient client)
        {
            var constructorParameters = new[]{KnownParameters.ClientDiagnostics, KnownParameters.Pipeline}.Union(client.RestClient.Parameters).ToArray();
            return new ConstructorSignature(client.Type, $"Initializes a new instance of {client.Declaration.Name}", null, MethodSignatureModifiers.Internal, constructorParameters);
        }
    }
}
