// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models.Responses;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Requests;
using AutoRest.CSharp.Output.Models.Shared;
using Azure.Core;

namespace AutoRest.CSharp.Generation.Writers
{
    internal class RestClientWriter
    {
        internal delegate void WriteFuncBody(CodeWriter writer, CodeWriterDeclaration messageVariable, RestClientMethod operation, string pipelineName, bool async);
        internal delegate void WriteStatusCodeImplementation(CodeWriter writer, CodeWriterDeclaration messageVariable, RestClientMethod operation, bool async, FieldDeclaration fieldDeclaration);

        public void WriteClient(CodeWriter writer, DataPlaneRestClient restClient)
        {
            using (writer.Namespace(restClient.Type.Namespace))
            {
                using (writer.Scope($"{restClient.Declaration.Accessibility} partial class {restClient.Type:D}", scopeDeclarations: restClient.Fields.ScopeDeclarations))
                {
                    var responseClassifierTypes = new List<ResponseClassifierType>();
                    writer.WriteFieldDeclarations(restClient.Fields);
                    WriteClientCtor(writer, restClient);
                    foreach (var method in restClient.Methods)
                    {
                        RequestWriterHelpers.WriteRequestCreation(writer, method, "internal", restClient.Fields, null, false, restClient.Parameters);
                        WriteOperation(writer, method, restClient.Fields.PipelineField.Name, true, WriteFuncBodyWithSend, null, MethodSignatureModifiers.Public, WriteStatusCodeSwitch, restClient.Fields.GetFieldByParameter(KnownParameters.ClientDiagnostics));
                        WriteOperation(writer, method, restClient.Fields.PipelineField.Name, false, WriteFuncBodyWithSend, null, MethodSignatureModifiers.Public, WriteStatusCodeSwitch, restClient.Fields.GetFieldByParameter(KnownParameters.ClientDiagnostics));
                        var protocolMethod = restClient.ProtocolMethods.FirstOrDefault(m => m.RequestMethod.Operation.Equals(method.Operation));
                        if (protocolMethod != null)
                        {
                            DpgClientWriter.WriteProtocolMethods(writer, restClient.Fields, protocolMethod);
                            responseClassifierTypes.Add(protocolMethod.RequestMethod.ResponseClassifierType);
                        }
                    }

                    DpgClientWriter.WriteResponseClassifierMethod(writer, responseClassifierTypes);
                }
            }
        }

        private static void WriteClientCtor(CodeWriter writer, DataPlaneRestClient restClient)
        {
            var constructor = restClient.Constructor;
            writer.WriteMethodDocumentation(constructor);
            using (writer.WriteMethodDeclaration(constructor))
            {
                foreach (Parameter clientParameter in constructor.Parameters)
                {
                    var field = restClient.Fields.GetFieldByParameter(clientParameter);
                    if (field != null)
                    {
                        writer.WriteVariableAssignmentWithNullCheck($"{field.Name}", clientParameter);
                    }
                }
            }
            writer.Line();
        }

        public static void WriteOperation(CodeWriter writer, RestClientMethod operation, string pipelineName, bool async, WriteFuncBody writeFuncBody, string? methodName = null, MethodSignatureModifiers modifiers = MethodSignatureModifiers.Public, WriteStatusCodeImplementation? writeStatusCodeImplementation = null, FieldDeclaration? fieldDeclaration = null)
        {
            using var methodScope = writer.AmbientScope();

            CSharpType? bodyType = operation.ReturnType;
            CSharpType? headerModelType = operation.HeaderModel?.Type;
            CSharpType returnType = bodyType switch
            {
                null when headerModelType != null => new CSharpType(typeof(ResponseWithHeaders<>), headerModelType),
                { } when headerModelType == null => new CSharpType(Configuration.ApiTypes.ResponseOfTType, bodyType),
                { } => new CSharpType(typeof(ResponseWithHeaders<>), bodyType, headerModelType),
                _ => new CSharpType(Configuration.ApiTypes.ResponseType),
            };

            var parameters = operation.Parameters.Where(p => p.Name != KnownParameters.RequestContext.Name).Append(KnownParameters.CancellationTokenParameter).ToArray();
            var method = new MethodSignature($"{methodName ?? operation.Name}", FormattableStringHelpers.FromString(operation.Summary), FormattableStringHelpers.FromString(operation.Description), modifiers, returnType, null, parameters).WithAsync(async);

            writer.WriteXmlDocumentationSummary(method.SummaryText)
                .WriteXmlDocumentationParameters(method.Parameters)
                .WriteXmlDocumentationRequiredParametersException(method.Parameters)
                .WriteXmlDocumentation("remarks", method.DescriptionText);

            if (method.ReturnDescription != null)
            {
                writer.WriteXmlDocumentationReturns(method.ReturnDescription);
            }
            using (writer.WriteMethodDeclaration(method))
            {
                writer.WriteParameterNullChecks(parameters);
                var messageVariable = new CodeWriterDeclaration("message");
                writeFuncBody(writer, messageVariable, operation, pipelineName, async);

                if (writeStatusCodeImplementation != null && fieldDeclaration != null)
                {
                    writeStatusCodeImplementation(writer, messageVariable, operation, async, fieldDeclaration);
                }
            }
            writer.Line();
        }

        private void WriteFuncBodyWithSend(CodeWriter writer, CodeWriterDeclaration messageVariable, RestClientMethod operation, string pipelineName, bool async)
        {
            var requestMethodName = RequestWriterHelpers.CreateRequestMethodName(operation.Name);

            writer
                .Line($"using var {messageVariable:D} = {requestMethodName}({operation.Parameters.GetIdentifiersFormattable()});")
                .WriteEnableHttpRedirectIfNecessary(operation, new VariableReference(Configuration.ApiTypes.HttpMessageType, messageVariable))
                .WriteMethodCall(async, $"{pipelineName}.SendAsync", $"{pipelineName}.Send", $"{messageVariable}, {KnownParameters.CancellationTokenParameter.Name}");
        }

        private void WriteStatusCodeSwitch(CodeWriter writer, CodeWriterDeclaration messageVariable, RestClientMethod operation, bool async, FieldDeclaration clientDiagnosticsField)
        {
            ResponseWriterHelpers.WriteStatusCodeSwitch(writer, $"{messageVariable.ActualName}", operation, async, clientDiagnosticsField);
        }
    }
}
