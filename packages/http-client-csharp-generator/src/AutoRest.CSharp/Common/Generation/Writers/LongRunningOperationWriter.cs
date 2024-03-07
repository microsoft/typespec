// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Threading;
using System.Threading.Tasks;
using Autorest.CSharp.Core;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models.Requests;
using Azure;
using Azure.Core;
using Request = Azure.Core.Request;

namespace AutoRest.CSharp.Generation.Writers
{
    internal sealed class LongRunningOperationWriter
    {
        public void Write(CodeWriter writer, LongRunningOperation operation)
        {
            var pagingResponse = operation.PagingResponse;

            var cs = operation.Type;
            var @namespace = cs.Namespace;
            using (writer.Namespace(@namespace))
            {
                writer.WriteXmlDocumentationSummary($"{operation.Description}");
                var interfaceType = GetInterfaceType(operation);
                var baseType = GetBaseType(operation);
                var helperType = GetHelperType(operation);

                writer.Append($"{operation.Declaration.Accessibility} partial class {cs.Name}: {baseType}");
                if (interfaceType != null)
                {
                    writer.Append($", {interfaceType}");
                }

                using (writer.Scope())
                {
                    WriteFields(writer, pagingResponse, helperType);

                    writer.Line();
                    writer.WriteXmlDocumentationSummary($"Initializes a new instance of {cs.Name} for mocking.");
                    using (writer.Scope($"protected {cs.Name:D}()"))
                    {
                    }

                    writer.Line();

                    WriteConstructor(writer, operation, pagingResponse, cs, helperType);
                    writer.Line();

                    writer
                        .WriteXmlDocumentationInheritDoc()
                        .Line($"#pragma warning disable CA1822")
                        .Line($"public override string Id => throw new NotImplementedException();")
                        .Line($"#pragma warning restore CA1822")
                        .Line();

                    WriteValueProperty(writer, operation);

                    writer.WriteXmlDocumentationInheritDoc();
                    writer.Line($"public override bool HasCompleted => _operation.HasCompleted;");
                    writer.Line();

                    if (operation.ResultType != null)
                    {
                        writer.WriteXmlDocumentationInheritDoc();
                        writer.Line($"public override bool HasValue => _operation.HasValue;");
                        writer.Line();
                    }

                    writer.WriteXmlDocumentationInheritDoc();
                    writer.Line($"public override {Configuration.ApiTypes.ResponseType} {Configuration.ApiTypes.GetRawResponseName}() => _operation.RawResponse;");
                    writer.Line();

                    writer.WriteXmlDocumentationInheritDoc();
                    writer.Line($"public override {Configuration.ApiTypes.ResponseType} UpdateStatus({typeof(CancellationToken)} cancellationToken = default) => _operation.UpdateStatus(cancellationToken);");
                    writer.Line();

                    writer.WriteXmlDocumentationInheritDoc();
                    writer.Line($"public override {Configuration.ApiTypes.GetValueTaskOfResponse()} UpdateStatusAsync({typeof(CancellationToken)} cancellationToken = default) => _operation.UpdateStatusAsync(cancellationToken);");
                    writer.Line();

                    WriteWaitForCompletionVariants(writer, operation);
                    writer.Line();

                    if (operation.ResultType != null)
                    {
                        WriteCreateResult(writer, operation, pagingResponse, operation.ResultType, interfaceType!);
                        writer.Line();
                        WriteCreateResultAsync(writer, operation, pagingResponse, operation.ResultType, interfaceType!);
                    }
                }
            }
        }

        private CSharpType? GetInterfaceType(LongRunningOperation operation)
        {
            return operation.ResultType != null ? new CSharpType(typeof(IOperationSource<>), operation.ResultType) : null;
        }

        private CSharpType GetNextLinkOperationType(LongRunningOperation operation)
        {
            return operation.ResultType != null ? new CSharpType(typeof(IOperation<>), operation.ResultType) : typeof(IOperation);
        }

        private CSharpType GetBaseType(LongRunningOperation operation)
        {
            return operation.ResultType != null ? new CSharpType(typeof(Operation<>), operation.ResultType) : new CSharpType(typeof(Operation));
        }

        private CSharpType GetValueTaskType(LongRunningOperation operation)
        {
            return operation.ResultType != null ? new CSharpType(Configuration.ApiTypes.ResponseOfTType, operation.ResultType) : new CSharpType(Configuration.ApiTypes.ResponseType);
        }

        private CSharpType GetHelperType(LongRunningOperation operation)
        {
            return operation.ResultType != null ? new CSharpType(typeof(OperationInternal<>), operation.ResultType) : new CSharpType(typeof(OperationInternal));
        }

        private void WriteFields(CodeWriter writer, PagingResponseInfo? pagingResponse, CSharpType helperType)
        {
            writer.Line($"private readonly {helperType} _operation;");

            if (pagingResponse != null)
            {
                writer.Line($"private readonly {Configuration.ApiTypes.GetNextPageFuncType()} _nextPageFunc;");
                writer.Line($"private readonly {Configuration.ApiTypes.ClientDiagnosticsType} _clientDiagnostics;");
                writer.Line($"private readonly {Configuration.ApiTypes.HttpPipelineType} _pipeline;");
            }
        }

        private void WriteConstructor(CodeWriter writer, LongRunningOperation operation, PagingResponseInfo? pagingResponse, CSharpType lroType, CSharpType helperType)
        {
            writer.Append($"internal {lroType.Name}({Configuration.ApiTypes.ClientDiagnosticsType} clientDiagnostics, {Configuration.ApiTypes.HttpPipelineType} pipeline, {typeof(Request)} request, {Configuration.ApiTypes.ResponseType} {Configuration.ApiTypes.ResponseParameterName}");

            if (pagingResponse != null)
            {
                writer.Append($", {Configuration.ApiTypes.GetNextPageFuncType()} nextPageFunc");
            }
            writer.Line($")");

            using (writer.Scope())
            {
                var nextLinkOperationVariable = new CodeWriterDeclaration("nextLinkOperation");
                writer
                    .Append($"{GetNextLinkOperationType(operation)} {nextLinkOperationVariable:D} = {typeof(NextLinkOperationImplementation)}.{nameof(NextLinkOperationImplementation.Create)}(")
                    .AppendIf($"this, ", operation.ResultType != null)
                    .Line($"pipeline, request.Method, request.Uri.ToUri(), {Configuration.ApiTypes.ResponseParameterName}, {typeof(OperationFinalStateVia)}.{operation.FinalStateVia});")
                    .Line($"_operation = new {helperType}(nextLinkOperation, clientDiagnostics, {Configuration.ApiTypes.ResponseParameterName}, { operation.Diagnostics.ScopeName:L});");

                if (pagingResponse != null)
                {
                    writer.Line($"_nextPageFunc = nextPageFunc;");
                    writer.Line($"_clientDiagnostics = clientDiagnostics;");
                    writer.Line($"_pipeline = pipeline;");
                }
            }
        }

        private void WriteValueProperty(CodeWriter writer, LongRunningOperation operation)
        {
            if (operation.ResultType != null)
            {
                writer.WriteXmlDocumentationInheritDoc();
                writer.Line($"public override {operation.ResultType} Value => _operation.Value;");
                writer.Line();
            }
        }

        private void WriteWaitForCompletionVariants(CodeWriter writer, LongRunningOperation operation)
        {
            var valueTaskType = GetValueTaskType(operation);
            var waitForCompletionMethodName = operation.ResultType != null ? "WaitForCompletion" : "WaitForCompletionResponse";

            WriteWaitForCompletionMethods(writer, valueTaskType, waitForCompletionMethodName, false);
            WriteWaitForCompletionMethods(writer, valueTaskType, waitForCompletionMethodName, true);
        }

        private void WriteWaitForCompletionMethods(CodeWriter writer, CSharpType valueTaskType, string waitForCompletionMethodName, bool async)
        {
            var waitForCompletionType = async ? new CSharpType(typeof(ValueTask<>), valueTaskType) : valueTaskType;

            writer.WriteXmlDocumentationInheritDoc();
            writer.Line($"public override {waitForCompletionType} {waitForCompletionMethodName}{(async ? "Async" : string.Empty)}({typeof(CancellationToken)} cancellationToken = default) => _operation.{waitForCompletionMethodName}{(async ? "Async" : string.Empty)}(cancellationToken);");
            writer.Line();

            writer.WriteXmlDocumentationInheritDoc();
            writer.Line($"public override {waitForCompletionType} {waitForCompletionMethodName}{(async ? "Async" : string.Empty)}({typeof(TimeSpan)} pollingInterval, {typeof(CancellationToken)} cancellationToken = default) => _operation.{waitForCompletionMethodName}{(async ? "Async" : string.Empty)}(pollingInterval, cancellationToken);");
            writer.Line();
        }

        private static void WriteCreateResult(CodeWriter writer, LongRunningOperation operation, PagingResponseInfo? pagingResponse, CSharpType resultType, CSharpType interfaceType)
        {
            var responseVariable = new CodeWriterDeclaration(Configuration.ApiTypes.ResponseParameterName);
            using (writer.Scope($"{resultType} {interfaceType}.CreateResult({Configuration.ApiTypes.ResponseType} {responseVariable:D}, {typeof(CancellationToken)} cancellationToken)"))
            {
                WriteCreateResultBody(writer, operation, responseVariable, pagingResponse, resultType, false);
            }
        }

        private static void WriteCreateResultAsync(CodeWriter writer, LongRunningOperation operation, PagingResponseInfo? pagingResponse, CSharpType resultType, CSharpType interfaceType)
        {
            var responseVariable = new CodeWriterDeclaration(Configuration.ApiTypes.ResponseParameterName);
            var asyncKeyword = pagingResponse == null && operation.ResultSerialization != null ? "async " : "";
            using (writer.Scope($"{asyncKeyword}{new CSharpType(typeof(ValueTask<>), resultType)} {interfaceType}.CreateResultAsync({Configuration.ApiTypes.ResponseType} {responseVariable:D}, {typeof(CancellationToken)} cancellationToken)"))
            {
                WriteCreateResultBody(writer, operation, responseVariable, pagingResponse, resultType, true);
            }
        }

        private static void WriteCreateResultBody(CodeWriter writer, LongRunningOperation operation, CodeWriterDeclaration responseVariable, PagingResponseInfo? pagingResponse, CSharpType resultType, bool async)
        {
            if (pagingResponse != null)
            {
                var scopeName = operation.Diagnostics.ScopeName;
                var nextLinkName = pagingResponse.NextLinkPropertyName;
                var itemName = pagingResponse.ItemPropertyName;
                // TODO -- why we have a hard-coded Product.DeserializeProduct here???
                FormattableString returnValue = $"{typeof(GeneratorPageableHelpers)}.{nameof(GeneratorPageableHelpers.CreateAsyncPageable)}({responseVariable}, _nextPageFunc, e => Product.DeserializeProduct(e), _clientDiagnostics, _pipeline, {scopeName:L}, {itemName:L}, {nextLinkName:L}, cancellationToken)";
                WriteCreateResultReturnValue(writer, resultType, returnValue, async);
            }
            else if (operation.ResultSerialization != null)
            {
                writer.WriteDeserializationForMethods(operation.ResultSerialization, async, null, $"{responseVariable}.{Configuration.ApiTypes.ContentStreamName}", resultType);
            }
            else
            {
                WriteCreateResultReturnValue(writer, resultType, $"{responseVariable}", async);
            }
        }

        private static void WriteCreateResultReturnValue(CodeWriter writer, CSharpType resultType, FormattableString returnValue, bool async)
        {
            if (async)
            {
                writer.Line($"return new {new CSharpType(typeof(ValueTask<>), resultType)}({returnValue});");
            }
            else
            {
                writer.Line($"return {returnValue};");
            }
        }
    }
}
