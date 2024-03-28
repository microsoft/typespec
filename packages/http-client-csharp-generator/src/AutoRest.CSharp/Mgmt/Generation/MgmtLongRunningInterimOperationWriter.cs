// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.ComponentModel;
using System.Threading;
using System.Threading.Tasks;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Mgmt.Output;
using AutoRest.CSharp.Output.Models.Shared;
using Azure.Core;
using Request = Azure.Core.Request;

namespace AutoRest.CSharp.Mgmt.Generation
{
    internal class MgmtLongRunningInterimOperationWriter
    {
        private readonly CodeWriter _writer;
        private readonly LongRunningInterimOperation _interimOperation;

        public MgmtLongRunningInterimOperationWriter(LongRunningInterimOperation interimOperation)
        {
            _writer = new CodeWriter();
            _interimOperation = interimOperation;
        }

        public void Write()
        {
            using (_writer.Namespace(MgmtContext.Context.DefaultNamespace))
            {
                _writer.WriteXmlDocumentationSummary($"A class representing the specific long-running operation {_interimOperation.TypeName}.");
                _writer.Line($"public class {_interimOperation.TypeName} : {_interimOperation.BaseClassType}");
                using (_writer.Scope())
                {
                    _writer.Line($"private readonly {_interimOperation.OperationType} _operation;");
                    _writer.Line();

                    _writer.Line($"private readonly {_interimOperation.IOperationSourceType} _operationSource;");
                    _writer.Line();

                    _writer.Line($"private readonly {_interimOperation.StateLockType} _stateLock;");
                    _writer.Line();

                    _writer.Line($"private readonly {Configuration.ApiTypes.ResponseType} _interimResponse;");
                    _writer.Line();

                    _writer.WriteXmlDocumentationSummary($"Initializes a new instance of {_interimOperation.TypeName} for mocking.");
                    using (_writer.Scope($"protected {_interimOperation.TypeName}()"))
                    {
                    }
                    _writer.Line();

                    using (_writer.Scope($"internal {_interimOperation.TypeName}({_interimOperation.IOperationSourceType} source, {Configuration.ApiTypes.ClientDiagnosticsType} clientDiagnostics, {Configuration.ApiTypes.HttpPipelineType} pipeline, {typeof(Request)} request, {Configuration.ApiTypes.ResponseType} {Configuration.ApiTypes.ResponseParameterName}, {typeof(OperationFinalStateVia)} finalStateVia)"))
                    {
                        _writer.Line($"_operation = new {_interimOperation.OperationType}(source, clientDiagnostics, pipeline, request, {Configuration.ApiTypes.ResponseParameterName}, finalStateVia);");
                        _writer.Line($"_operationSource = source;");
                        _writer.Line($"_stateLock = new {_interimOperation.StateLockType}();");
                        _writer.Line($"_interim{Configuration.ApiTypes.ResponseType.Name} = {Configuration.ApiTypes.ResponseParameterName};");
                    }
                    _writer.Line();

                    _writer.WriteXmlDocumentationInheritDoc();
                    _writer
                        .LineRaw("#pragma warning disable CA1822")
                        .LineRaw($"[{typeof(EditorBrowsableAttribute)}({typeof(EditorBrowsableState)}.{nameof(EditorBrowsableState.Never)})]")
                        .LineRaw("public override string Id => throw new NotImplementedException();")
                        .LineRaw("#pragma warning restore CA1822")
                        .Line();

                    _writer.WriteXmlDocumentationInheritDoc();
                    _writer.Line($"public override {_interimOperation.ReturnType} Value => _operation.Value;");
                    _writer.Line();

                    _writer.WriteXmlDocumentationInheritDoc();
                    _writer.Line($"public override bool HasValue => _operation.HasValue;");
                    _writer.Line();

                    _writer.WriteXmlDocumentationInheritDoc();
                    _writer.Line($"public override bool HasCompleted => _operation.HasCompleted;");
                    _writer.Line();

                    _writer.WriteXmlDocumentationInheritDoc();
                    _writer.Line($"public override {Configuration.ApiTypes.ResponseType} {Configuration.ApiTypes.GetRawResponseName}() => _operation.{Configuration.ApiTypes.GetRawResponseName}();");
                    _writer.Line();

                    _writer.WriteXmlDocumentationInheritDoc();
                    _writer.Line($"public override {Configuration.ApiTypes.ResponseType} UpdateStatus({typeof(CancellationToken)} cancellationToken = default) => _operation.UpdateStatus(cancellationToken);");
                    _writer.Line();

                    _writer.WriteXmlDocumentationInheritDoc();
                    _writer.Line($"public override {typeof(ValueTask<>).MakeGenericType(Configuration.ApiTypes.ResponseType)} UpdateStatusAsync({typeof(CancellationToken)} cancellationToken = default) => _operation.UpdateStatusAsync(cancellationToken);");
                    _writer.Line();

                    _writer.WriteXmlDocumentationInheritDoc();
                    _writer.Line($"public override {_interimOperation.ResponseType} WaitForCompletion({typeof(CancellationToken)} cancellationToken = default) => _operation.WaitForCompletion(cancellationToken);");
                    _writer.Line();

                    _writer.WriteXmlDocumentationInheritDoc();
                    _writer.Line($"public override {_interimOperation.ResponseType} WaitForCompletion({typeof(TimeSpan)} pollingInterval, {typeof(CancellationToken)} cancellationToken = default) => _operation.WaitForCompletion(pollingInterval, cancellationToken);");
                    _writer.Line();

                    _writer.WriteXmlDocumentationInheritDoc();
                    _writer.Line($"public override {typeof(ValueTask)}<{_interimOperation.ResponseType}> WaitForCompletionAsync({typeof(CancellationToken)} cancellationToken = default) => _operation.WaitForCompletionAsync(cancellationToken);");
                    _writer.Line();

                    _writer.WriteXmlDocumentationInheritDoc();
                    _writer.Line($"public override {typeof(ValueTask)}<{_interimOperation.ResponseType}> WaitForCompletionAsync({typeof(TimeSpan)} pollingInterval, {typeof(CancellationToken)} cancellationToken = default) => _operation.WaitForCompletionAsync(pollingInterval, cancellationToken);");
                    _writer.Line();

                    _writer.WriteXmlDocumentationSummary($"Gets interim status of the long-running operation.");
                    _writer.WriteXmlDocumentationParameter(KnownParameters.CancellationTokenParameter);
                    _writer.WriteXmlDocumentationReturns($"The interim status of the long-running operation.");
                    _writer.Line($"public virtual async {_interimOperation.ValueTaskType} GetCurrentStatusAsync({typeof(CancellationToken)} cancellationToken = default) => await GetCurrentState(true, cancellationToken).ConfigureAwait(false);");
                    _writer.Line();

                    _writer.WriteXmlDocumentationSummary($"Gets interim status of the long-running operation.");
                    _writer.WriteXmlDocumentationParameter(KnownParameters.CancellationTokenParameter);
                    _writer.WriteXmlDocumentationReturns($"The interim status of the long-running operation.");
                    _writer.Line($"public virtual {_interimOperation.ReturnType} GetCurrentStatus({typeof(CancellationToken)} cancellationToken = default) => GetCurrentState(false, cancellationToken).EnsureCompleted();");
                    _writer.Line();

                    using (_writer.Scope($"private async {_interimOperation.ValueTaskType} GetCurrentState({typeof(bool)} async, {typeof(CancellationToken)} cancellationToken)"))
                    {
                        _writer.Line($"using var asyncLock = await _stateLock.GetLockOrValueAsync(async, cancellationToken).ConfigureAwait(false);");
                        using (_writer.Scope($"if (asyncLock.HasValue)"))
                        {
                            _writer.Line($"return asyncLock.Value;");
                        }
                        _writer.Line($"var val = async ? await _operationSource.CreateResultAsync(_interimResponse, cancellationToken).ConfigureAwait(false)");
                        _writer.Line($"\t\t: _operationSource.CreateResult(_interimResponse, cancellationToken);");
                        _writer.Line($"asyncLock.SetValue(val);");
                        _writer.Line($"return val;");
                    }
                }
            }
        }

        public override string ToString()
        {
            return _writer.ToString();
        }
    }
}
