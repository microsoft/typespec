// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Mgmt.Output;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Requests;
using AutoRest.CSharp.Output.Models.Shared;
using Azure.Core;

namespace AutoRest.CSharp.Mgmt.Generation
{
    internal class MgmtRestClientWriter
    {
        private const string UserAgentVariable = "userAgent";
        private const string UserAgentField = "_" + UserAgentVariable;

        public void WriteClient(CodeWriter writer, MgmtRestClient restClient)
        {
            using (writer.Namespace(restClient.Type.Namespace))
            {
                using (writer.Scope($"{restClient.Declaration.Accessibility} partial class {restClient.Type:D}"))
                {
                    WriteClientFields(writer, restClient);
                    WriteClientCtor(writer, restClient);

                    foreach (var method in restClient.Methods.Select(m => m.Method))
                    {
                        RequestWriterHelpers.WriteRequestCreation(writer, method, "internal", restClient.Fields, null, true, restClient.Parameters);
                        WriteOperation(writer, restClient, method, true);
                        WriteOperation(writer, restClient, method, false);
                    }
                }
            }
        }

        protected void WriteClientFields(CodeWriter writer, MgmtRestClient restClient)
        {
            writer.Line($"private readonly {typeof(TelemetryDetails)} {UserAgentField};");
            writer.WriteFieldDeclarations(restClient.Fields);
        }

        private static void WriteClientCtor(CodeWriter writer, MgmtRestClient restClient)
        {
            var constructorParameters = restClient.Parameters;
            var constructor = new ConstructorSignature(restClient.Type, null, $"Initializes a new instance of {restClient.Type.Name}", MethodSignatureModifiers.Public, restClient.Parameters);

            writer.WriteMethodDocumentation(constructor);
            using (writer.WriteMethodDeclaration(constructor))
            {
                foreach (Parameter clientParameter in constructorParameters)
                {
                    var field = restClient.Fields.GetFieldByParameter(clientParameter);
                    if (field != null)
                    {
                        writer.WriteVariableAssignmentWithNullCheck($"{field.Name}", clientParameter);
                    }
                }
                writer.Line($"{UserAgentField} = new {typeof(TelemetryDetails)}(GetType().Assembly, {MgmtRestClient.ApplicationIdParameter.Name});");
            }
            writer.Line();
        }

        private static void WriteOperation(CodeWriter writer, MgmtRestClient restClient, RestClientMethod operation, bool async)
        {
            var returnType = operation.ReturnType != null
                ? new CSharpType(Configuration.ApiTypes.ResponseOfTType, operation.ReturnType)
                : new CSharpType(Configuration.ApiTypes.ResponseType);

            var parameters = operation.Parameters.Append(KnownParameters.CancellationTokenParameter).ToArray();
            var method = new MethodSignature(operation.Name, $"{operation.Summary}", $"{operation.Description}", MethodSignatureModifiers.Public, returnType, null, parameters).WithAsync(async);

            writer
                .WriteXmlDocumentationSummary($"{method.Description}")
                .WriteMethodDocumentationSignature(method);

            using (writer.WriteMethodDeclaration(method))
            {
                writer.WriteParametersValidation(parameters);
                var messageVariable = new CodeWriterDeclaration("message");
                var requestMethodName = RequestWriterHelpers.CreateRequestMethodName(operation.Name);

                writer
                    .Line($"using var {messageVariable:D} = {requestMethodName}({operation.Parameters.GetIdentifiersFormattable()});")
                    .WriteMethodCall(async, $"{restClient.Fields.PipelineField.Name}.SendAsync", $"{restClient.Fields.PipelineField.Name}.Send", $"{messageVariable}, {KnownParameters.CancellationTokenParameter.Name}");

                ResponseWriterHelpers.WriteStatusCodeSwitch(writer, messageVariable.ActualName, operation, async, null);
            }
            writer.Line();
        }
    }
}
