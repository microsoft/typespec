// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using AutoRest.CSharp.Common.Generation.Writers;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Mgmt.Decorator;
using AutoRest.CSharp.Mgmt.Models;
using AutoRest.CSharp.Mgmt.Output;
using AutoRest.CSharp.Mgmt.Output.Models;
using AutoRest.CSharp.Output.Models.Requests;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Utilities;
using Azure;
using Azure.Core;
using Azure.ResourceManager.ManagementGroups;
using Azure.ResourceManager.Resources;
using static AutoRest.CSharp.Mgmt.Decorator.ParameterMappingBuilder;

namespace AutoRest.CSharp.Mgmt.Generation
{
    internal abstract class MgmtClientBaseWriter : ClientWriter
    {
        protected const string EndpointProperty = "Endpoint";
        protected delegate void WriteMethodDelegate(MgmtClientOperation clientOperation, Diagnostic diagnostic, bool isAsync);
        private string LibraryArmOperation { get; }
        protected bool IsArmCore { get; }
        protected CodeWriter _writer;
        protected override string RestClientAccessibility => "private";

        private MgmtTypeProvider This { get; }

        protected virtual string ArmClientReference { get; } = "Client";

        protected virtual bool UseField => true;

        protected virtual bool SkipParameterValidation => false;

        public string FileName { get; }

        protected MgmtClientBaseWriter(CodeWriter writer, MgmtTypeProvider provider)
        {
            _writer = writer;
            This = provider;
            FileName = This.Type.Name;
            IsArmCore = Configuration.MgmtConfiguration.IsArmCore;
            LibraryArmOperation = $"{MgmtContext.Context.DefaultNamespace.Split('.').Last()}ArmOperation";
        }

        public virtual void Write()
        {
            using (_writer.Namespace(This.Namespace))
            {
                WriteClassDeclaration();
                using (_writer.Scope())
                {
                    WriteImplementations();
                }
            }
        }

        protected internal virtual void WriteImplementations()
        {
            WriteStaticMethods();

            WriteFields();

            WriteCtors();

            WriteProperties();

            WritePrivateHelpers();

            _writer.Line(); // TODO -- add this here to minimize the amount of code changes, this could be removed after future refactor
            foreach (var method in This.ChildResourceEntryMethods)
            {
                _writer.WriteMethodDocumentation(method.Signature);
                _writer.WriteMethod(method);
            }

            WriteOperations();

            if (This.EnumerableInterfaces.Any())
                WriteEnumerables();
        }

        protected virtual void WritePrivateHelpers() { }
        protected virtual void WriteProperties() { }
        protected virtual void WriteStaticMethods() { }

        protected virtual void WriteOperations()
        {
            foreach (var clientOperation in This.AllOperations)
            {
                WriteMethod(clientOperation, true);
                WriteMethod(clientOperation, false);
            }
        }

        protected void WriteClassDeclaration()
        {
            _writer.WriteXmlDocumentationSummary(This.Description);
            _writer.AppendRaw(This.Accessibility)
                .AppendRawIf(" static", This.IsStatic)
                .Append($" partial class {This.Type.Name}");
            if (This.GetImplements().Any())
            {
                _writer.Append($" : ");
                foreach (var type in This.GetImplements())
                {
                    _writer.Append($"{type:D},");
                }
                _writer.RemoveTrailingComma();
            }
            _writer.Line();
        }

        protected virtual void WriteCtors()
        {
            if (This.IsStatic)
                return;

            if (This.MockingCtor is not null)
            {
                _writer.WriteMethodDocumentation(This.MockingCtor);
                using (_writer.WriteMethodDeclaration(This.MockingCtor))
                {
                }
            }

            _writer.Line();
            if (This.ResourceDataCtor is not null)
            {
                _writer.WriteMethodDocumentation(This.ResourceDataCtor);
                using (_writer.WriteMethodDeclaration(This.ResourceDataCtor))
                {
                    _writer.Line($"HasData = true;");
                    _writer.Line($"_data = {This.DefaultResource!.ResourceDataParameter.Name};");
                }
            }

            _writer.Line();
            if (This.ArmClientCtor is not null)
            {
                _writer.Line();
                _writer.WriteMethodDocumentation(This.ArmClientCtor);
                using (_writer.WriteMethodDeclaration(This.ArmClientCtor))
                {
                    if (!This.IsInitializedByProperties)
                    {
                        foreach (var param in This.ExtraConstructorParameters)
                        {
                            _writer.Line($"_{param.Name} = {param.Name};");
                        }

                        foreach (var set in This.UniqueSets)
                        {
                            WriteRestClientConstructorPair(set.RestClient, set.Resource);
                        }
                        if (This.CanValidateResourceType)
                            WriteDebugValidate();
                    }
                }
            }
            _writer.Line();
        }

        private string GetEnumerableArgValue()
        {
            string value = string.Empty;
            if (This is ResourceCollection collection)
            {
                if (collection.GetAllOperation?.IsPropertyBagOperation == true)
                {
                    value = "options: null";
                }
            }
            return value;
        }

        private void WriteIEnumerable(CSharpType type)
        {
            _writer.Line();
            var enumeratorType = new CSharpType(typeof(IEnumerator<>), type.Arguments);
            _writer.Line($"{enumeratorType:I} {type:I}.GetEnumerator()");
            string argValue = GetEnumerableArgValue();
            using (_writer.Scope())
            {
                _writer.Line($"return GetAll({argValue}).GetEnumerator();");
            }
            _writer.Line();
            _writer.Line($"{typeof(IEnumerator)} {typeof(IEnumerable)}.GetEnumerator()");
            using (_writer.Scope())
            {
                _writer.Line($"return GetAll({argValue}).GetEnumerator();");
            }
        }

        private void WriteIAsyncEnumerable(CSharpType type)
        {
            _writer.Line();
            var enumeratorType = new CSharpType(typeof(IAsyncEnumerator<>), type.Arguments);
            _writer.Line($"{enumeratorType:I} {type:I}.GetAsyncEnumerator({KnownParameters.CancellationTokenParameter.Type:I} {KnownParameters.CancellationTokenParameter.Name})");
            string argValue = GetEnumerableArgValue();
            using (_writer.Scope())
            {
                _writer.Line($"return GetAllAsync({(argValue == string.Empty ? string.Empty : argValue + ", ")}{KnownParameters.CancellationTokenParameter.Name}: {KnownParameters.CancellationTokenParameter.Name}).GetAsyncEnumerator({KnownParameters.CancellationTokenParameter.Name});");
            }
        }

        private void WriteEnumerables()
        {
            foreach (var type in This.EnumerableInterfaces)
            {
                if (type.Name.StartsWith("IEnumerable"))
                    WriteIEnumerable(type);
                if (type.Name.StartsWith("IAsyncEnumerable"))
                    WriteIAsyncEnumerable(type);
            }
        }

        private void WriteRestClientConstructorPair(MgmtRestClient restClient, Resource? resource)
        {
            var resourceTypeExpression = ConstructResourceTypeExpression(resource);
            var ctorString = ConstructClientDiagnostic(_writer, $"{GetProviderNamespaceFromReturnType(resourceTypeExpression)}", DiagnosticsProperty);
            var diagFieldName = GetDiagnosticFieldName(restClient, resource);
            _writer.Line($"{diagFieldName} = {ctorString};");
            FormattableString? apiVersionExpression = null;
            if (resourceTypeExpression is not null)
            {
                string apiVersionVariable = GetApiVersionVariableName(restClient, resource);
                _writer.Line($"TryGetApiVersion({resourceTypeExpression}, out string {apiVersionVariable});");
                apiVersionExpression = $"{apiVersionVariable}";
            }
            _writer.Line($"{GetRestFieldName(restClient, resource)} = {GetRestConstructorString(restClient, apiVersionExpression)};");
        }

        protected FormattableString? ConstructResourceTypeExpression(Resource? resource)
        {
            if (resource != null)
                return $"{resource.Type.Name}.ResourceType";
            return null;
        }

        protected void WriteStaticValidate(FormattableString validResourceType)
        {
            using (_writer.Scope($"internal static void ValidateResourceId({typeof(Azure.Core.ResourceIdentifier)} id)"))
            {
                _writer.Line($"if (id.ResourceType != {validResourceType})");
                _writer.Line($"throw new {typeof(ArgumentException)}(string.Format({typeof(CultureInfo)}.CurrentCulture, \"Invalid resource type {{0}} expected {{1}}\", id.ResourceType, {validResourceType}), nameof(id));");
            }
        }

        protected void WriteDebugValidate()
        {
            _writer.Line($"#if DEBUG");
            _writer.Line($"\t\t\tValidateResourceId(Id);");
            _writer.Line($"#endif");
        }

        protected void WriteFields()
        {
            foreach (var field in This.Fields)
            {
                _writer.WriteField(field);
            }
            _writer.Line();
        }

        protected FormattableString GetProviderNamespaceFromReturnType(FormattableString? resourceTypeExpression)
        {
            if (resourceTypeExpression is not null)
                return $"{resourceTypeExpression}.Namespace";

            return $"ProviderConstants.DefaultProviderNamespace";
        }

        protected FormattableString ConstructClientDiagnostic(CodeWriter writer, FormattableString providerNamespace, string diagnosticsOptionsVariable)
        {
            return $"new {Configuration.ApiTypes.ClientDiagnosticsType}(\"{This.DiagnosticNamespace}\", {providerNamespace}, {diagnosticsOptionsVariable})";
        }

        protected FormattableString GetRestConstructorString(MgmtRestClient restClient, FormattableString? apiVersionExpression)
        {
            var paramList = new List<FormattableString>()
            {
                $"{PipelineProperty}",
                $"{DiagnosticsProperty}.ApplicationId"
            };

            if (restClient.Parameters.Any(p => p.Name.Equals("subscriptionId")))
            {
                paramList.Add($"Id.SubscriptionId");
            }
            paramList.Add($"{EndpointProperty}");
            if (apiVersionExpression != null)
            {
                paramList.Add(apiVersionExpression);
            }
            return $"new {restClient.Type}({paramList.Join(", ")})";
        }

        protected string GetRestClientName(MgmtRestOperation operation) => GetRestClientName(operation.RestClient, operation.Resource);
        private string GetRestClientName(MgmtRestClient client, Resource? resource)
        {
            var names = This.GetRestDiagNames(new NameSetKey(client, resource));
            return UseField ? names.RestField : names.RestProperty;
        }

        protected Reference GetDiagnosticReference(MgmtRestOperation operation) => new Reference(GetDiagnosticName(operation.RestClient, operation.Resource), Configuration.ApiTypes.ClientDiagnosticsType);
        private string GetDiagnosticName(MgmtRestClient client, Resource? resource)
        {
            var names = This.GetRestDiagNames(new NameSetKey(client, resource));
            return UseField ? names.DiagnosticField : names.DiagnosticProperty;
        }

        protected string GetRestPropertyName(MgmtRestClient client, Resource? resource) => This.GetRestDiagNames(new NameSetKey(client, resource)).RestProperty;
        protected string GetRestFieldName(MgmtRestClient client, Resource? resource) => This.GetRestDiagNames(new NameSetKey(client, resource)).RestField;
        protected string GetDiagnosticsPropertyName(MgmtRestClient client, Resource? resource) => This.GetRestDiagNames(new NameSetKey(client, resource)).DiagnosticProperty;
        protected string GetDiagnosticFieldName(MgmtRestClient client, Resource? resource) => This.GetRestDiagNames(new NameSetKey(client, resource)).DiagnosticField;
        protected virtual string GetApiVersionVariableName(MgmtRestClient client, Resource? resource) => This.GetRestDiagNames(new NameSetKey(client, resource)).ApiVersionVariable;

        protected internal static string GetConfigureAwait(bool isAsync)
        {
            return isAsync ? ".ConfigureAwait(false)" : string.Empty;
        }

        protected internal static string GetAsyncKeyword(bool isAsync)
        {
            return isAsync ? "async" : string.Empty;
        }

        protected internal static string GetAwait(bool isAsync)
        {
            return isAsync ? "await " : string.Empty;
        }

        protected internal static string GetNextLink(bool isNextPageFunc)
        {
            return isNextPageFunc ? "nextLink, " : string.Empty;
        }

        protected FormattableString GetResourceTypeExpression(ResourceTypeSegment resourceType)
        {
            if (resourceType == ResourceTypeSegment.ResourceGroup)
                return $"{typeof(ResourceGroupResource)}.ResourceType";
            if (resourceType == ResourceTypeSegment.Subscription)
                return $"{typeof(SubscriptionResource)}.ResourceType";
            if (resourceType == ResourceTypeSegment.Tenant)
                return $"{typeof(TenantResource)}.ResourceType";
            if (resourceType == ResourceTypeSegment.ManagementGroup)
                return $"{typeof(ManagementGroupResource)}.ResourceType";

            if (!resourceType.IsConstant)
                throw new NotImplementedException($"ResourceType that contains variables are not supported yet");

            // find the corresponding class of this resource type. If we find only one, use the constant inside that class. If we have multiple, use the hard-coded magic string
            var candidates = MgmtContext.Library.ArmResources.Where(resource => resource.ResourceType == resourceType);
            if (candidates.Count() == 1)
            {
                return $"{candidates.First().Type}.ResourceType";
            }
            return $"\"{resourceType.SerializedType}\"";
        }

        protected virtual void WriteMethod(MgmtClientOperation clientOperation, bool isAsync)
        {
            var writeBody = GetMethodDelegate(clientOperation);
            using (WriteCommonMethod(clientOperation, isAsync))
            {
                var diagnostic = new Diagnostic($"{This.Type.Name}.{clientOperation.Name}", Array.Empty<DiagnosticAttribute>());
                writeBody(clientOperation, diagnostic, isAsync);
            }
        }

        protected Dictionary<string, WriteMethodDelegate> _customMethods = new Dictionary<string, WriteMethodDelegate>();
        private WriteMethodDelegate GetMethodDelegate(MgmtClientOperation clientOperation)
        {
            if (!_customMethods.TryGetValue($"Write{clientOperation.Name}Body", out var function))
            {
                function = GetMethodDelegate(clientOperation.IsLongRunningOperation, clientOperation.IsPagingOperation);
            }

            return function;
        }

        protected virtual WriteMethodDelegate GetMethodDelegate(bool isLongRunning, bool isPaging)
            => (isLongRunning, isPaging) switch
            {
                (true, false) => WriteLROMethodBody,
                (false, true) => WritePagingMethodBody,
                (false, false) => WriteNormalMethodBody,
                (true, true) => WritePagingLROMethodBody,
            };

        private void WritePagingLROMethodBody(MgmtClientOperation clientOperation, Diagnostic diagnostic, bool isAsync)
        {
            throw new NotImplementedException($"Pageable LRO is not implemented yet, please use `remove-operation` directive to remove the following operationIds: {string.Join(", ", clientOperation.Select(o => o.OperationId))}");
        }

        protected virtual IDisposable WriteCommonMethod(MgmtClientOperation clientOperation, bool isAsync)
        {
            _writer.Line();
            var returnDescription = clientOperation.ReturnsDescription?.Invoke(isAsync);
            return _writer.WriteCommonMethod(clientOperation.MethodSignature, returnDescription, isAsync, This.Accessibility == "public", SkipParameterValidation);
        }

        #region PagingMethod
        protected virtual void WritePagingMethodBody(MgmtClientOperation clientOperation, Diagnostic diagnostic, bool isAsync)
        {
            // TODO -- since we are combining multiple operations under different parents, which description should we leave here
            // TODO -- find a better way to get this type
            var clientDiagField = GetDiagnosticReference(clientOperation.OperationMappings.First().Value);
            // we need to write multiple branches for a paging method
            if (clientOperation.OperationMappings.Count == 1)
            {
                // if we only have one branch, we would not need those if-else statements
                var branch = clientOperation.OperationMappings.Keys.First();
                WritePagingMethodBranch(clientOperation.ReturnType, diagnostic, clientDiagField, clientOperation.OperationMappings[branch], clientOperation.ParameterMappings[branch], isAsync);
            }
            else
            {
                var keyword = "if";
                var escapeBranches = new List<RequestPath>();
                foreach (var (branch, operation) in clientOperation.OperationMappings)
                {
                    // we need to identify the correct branch using the resource type, therefore we need first to determine the resource type is a constant
                    var resourceType = This.GetBranchResourceType(branch);
                    if (!resourceType.IsConstant)
                    {
                        escapeBranches.Add(branch);
                        continue;
                    }
                    using (_writer.Scope($"{keyword} ({This.BranchIdVariableName}.ResourceType == {GetResourceTypeExpression(resourceType)})"))
                    {
                        WritePagingMethodBranch(clientOperation.ReturnType, diagnostic, clientDiagField, operation, clientOperation.ParameterMappings[branch], isAsync);
                    }
                    keyword = "else if";
                }
                if (escapeBranches.Count == 0)
                {
                    using (_writer.Scope($"else"))
                    {
                        _writer.Line($"throw new {typeof(InvalidOperationException)}($\"{{{This.BranchIdVariableName}.ResourceType}} is not supported here\");");
                    }
                }
                else if (escapeBranches.Count == 1)
                {
                    var branch = escapeBranches.First();
                    using (_writer.Scope($"else"))
                    {
                        WritePagingMethodBranch(clientOperation.ReturnType, diagnostic, clientDiagField, clientOperation.OperationMappings[branch], clientOperation.ParameterMappings[branch], isAsync);
                    }
                }
                else
                {
                    throw new InvalidOperationException($"It is impossible to identify which branch to go here using Id for request paths: [{string.Join(", ", escapeBranches)}]");
                }
            }
        }

        protected void WritePagingMethodBranch(CSharpType itemType, Diagnostic diagnostic, Reference clientDiagnosticsReference, MgmtRestOperation operation, IEnumerable<ParameterMapping> parameterMappings, bool async)
        {
            var pagingMethod = operation.PagingMethod!;
            var firstPageRequestArguments = GetArguments(_writer, parameterMappings);
            var nextPageRequestArguments = firstPageRequestArguments.IsEmpty() ? $"{KnownParameters.NextLink.Name}" : $"{KnownParameters.NextLink.Name}, {firstPageRequestArguments}";

            FormattableString firstPageRequest = $"{GetRestClientName(operation)}.Create{pagingMethod.Method.Name}Request({firstPageRequestArguments})";
            FormattableString? nextPageRequest = pagingMethod.NextPageMethod != null ? $"{GetRestClientName(operation)}.Create{pagingMethod.NextPageMethod.Name}Request({nextPageRequestArguments})" : (FormattableString?)null;
            var pipelineReference = new Reference("Pipeline", Configuration.ApiTypes.HttpPipelineType);
            var scopeName = diagnostic.ScopeName;
            var itemName = pagingMethod.ItemName;
            var nextLinkName = pagingMethod.NextLinkName;

            _writer.WritePageableBody(parameterMappings.Select(p => p.Parameter).Append(KnownParameters.CancellationTokenParameter).ToList(), itemType, firstPageRequest, nextPageRequest, clientDiagnosticsReference, pipelineReference, scopeName, itemName, nextLinkName, async);
        }

        protected FormattableString CreateResourceIdentifierExpression(Resource resource, RequestPath requestPath, IEnumerable<ParameterMapping> parameterMappings, FormattableString dataExpression)
        {
            var methodWithLeastParameters = resource.CreateResourceIdentifierMethod.Signature;
            var cache = new List<ParameterMapping>(parameterMappings);

            var parameterInvocations = new List<FormattableString>();
            foreach (var reference in requestPath.Where(s => s.IsReference).Select(s => s.Reference))
            {
                var match = cache.First(p => reference.Name.Equals(p.Parameter.Name, StringComparison.InvariantCultureIgnoreCase) && reference.Type.Equals(p.Parameter.Type));
                cache.Remove(match);
                parameterInvocations.Add(match.IsPassThru ? $"{match.Parameter.Name}" : match.ValueExpression);
            }

            if (parameterInvocations.Count < methodWithLeastParameters.Parameters.Count)
            {
                if (resource.ResourceData.GetTypeOfName() != null)
                {
                    parameterInvocations.Add($"{dataExpression}.Name");
                }
                else
                {
                    throw new ErrorHelpers.ErrorException($"The resource data {resource.ResourceData.Type.Name} does not have a `Name` property, which is required when assigning non-resource as resources");
                }
            }

            return $"{resource.Type.Name}.CreateResourceIdentifier({parameterInvocations.Join(", ")})";
        }
        #endregion

        #region NormalMethod
        protected virtual void WriteNormalMethodBody(MgmtClientOperation clientOperation, Diagnostic diagnostic, bool async)
        {
            // we need to write multiple branches for a normal method
            if (clientOperation.OperationMappings.Count == 1)
            {
                // if we only have one branch, we would not need those if-else statements
                var branch = clientOperation.OperationMappings.Keys.First();
                WriteNormalMethodBranch(clientOperation.OperationMappings[branch], clientOperation.ParameterMappings[branch], diagnostic, async);
            }
            else
            {
                // branches go here
                throw new NotImplementedException("multi-branch normal method not supported yet");
            }
        }

        protected virtual void WriteNormalMethodBranch(MgmtRestOperation operation, IEnumerable<ParameterMapping> parameterMappings, Diagnostic diagnostic, bool async)
        {
            using (_writer.WriteDiagnosticScope(diagnostic, GetDiagnosticReference(operation)))
            {
                var response = new CodeWriterDeclaration(Configuration.ApiTypes.ResponseParameterName);
                _writer
                    .Append($"var {response:D} = {GetAwait(async)} ")
                    .Append($"{GetRestClientName(operation)}.{CreateMethodName(operation.Method.Name, async)}(");
                WriteArguments(_writer, parameterMappings);
                _writer.Line($"cancellationToken){GetConfigureAwait(async)};");

                if (operation.ThrowIfNull)
                {
                    _writer
                        .Line($"if ({response}.Value == null)")
                        .Line($"throw new {Configuration.ApiTypes.RequestFailedExceptionType}({response}.{Configuration.ApiTypes.GetRawResponseName}());");
                }
                var realReturnType = operation.MgmtReturnType;
                if (realReturnType != null && realReturnType is { IsFrameworkType: false, Implementation: Resource resource } && resource.ResourceData.ShouldSetResourceIdentifier)
                {
                    _writer.Line($"{response}.Value.Id = {CreateResourceIdentifierExpression(resource, operation.RequestPath, parameterMappings, $"{response}.Value")};");
                }

                // the case that we did not need to wrap the result
                var valueConverter = operation.GetValueConverter($"{ArmClientReference}", $"{response}.Value");
                if (valueConverter != null)
                {
                    _writer.Line($"return {Configuration.ApiTypes.ResponseType}.FromValue({valueConverter}, {response}.{Configuration.ApiTypes.GetRawResponseName}());");
                }
                else
                {
                    _writer.Line($"return {response};");
                }
            }
        }
        #endregion

        #region LROMethod
        protected virtual void WriteLROMethodBody(MgmtClientOperation clientOperation, Diagnostic diagnostic, bool async)
        {
            // TODO -- since we are combining multiple operations under different parents, which description should we leave here?
            // TODO -- find a way to properly get the LRO response type here. Temporarily we are using the first one
            // TODO -- we need to write multiple branches for a LRO operation
            using (_writer.WriteDiagnosticScope(diagnostic, GetDiagnosticReference(clientOperation.OperationMappings.Values.First())))
            {
                if (clientOperation.OperationMappings.Count == 1)
                {
                    // if we only have one branch, we would not need those if-else statements
                    var branch = clientOperation.OperationMappings.Keys.First();
                    WriteLROMethodBranch(clientOperation.OperationMappings[branch], clientOperation.ParameterMappings[branch], async);
                }
                else
                {
                    var keyword = "if";
                    var escapeBranches = new List<RequestPath>();
                    foreach ((var branch, var operation) in clientOperation.OperationMappings)
                    {
                        // we need to identify the correct branch using the resource type, therefore we need first to determine the resource type is a constant
                        var resourceType = This.GetBranchResourceType(branch);
                        if (!resourceType.IsConstant)
                        {
                            escapeBranches.Add(branch);
                            continue;
                        }
                        using (_writer.Scope($"{keyword} ({This.BranchIdVariableName}.ResourceType == {GetResourceTypeExpression(resourceType)})"))
                        {
                            WriteLROMethodBranch(operation, clientOperation.ParameterMappings[branch], async);
                        }
                        keyword = "else if";
                    }
                    if (escapeBranches.Count == 0)
                    {
                        using (_writer.Scope($"else"))
                        {
                            _writer.Line($"throw new InvalidOperationException($\"{{{This.BranchIdVariableName}.ResourceType}} is not supported here\");");
                        }
                    }
                    else if (escapeBranches.Count == 1)
                    {
                        var branch = escapeBranches.First();
                        using (_writer.Scope($"else"))
                        {
                            WriteLROMethodBranch(clientOperation.OperationMappings[branch], clientOperation.ParameterMappings[branch], async);
                        }
                    }
                    else
                    {
                        throw new InvalidOperationException($"It is impossible to identify which branch to go here using Id for request paths: [{string.Join(", ", escapeBranches)}]");
                    }
                }
            }
        }

        protected virtual void WriteLROMethodBranch(MgmtRestOperation operation, IEnumerable<ParameterMapping> parameterMapping, bool async)
        {
            _writer.Append($"var {Configuration.ApiTypes.ResponseParameterName} = {GetAwait(async)} {GetRestClientName(operation)}.{CreateMethodName(operation.Method.Name, async)}(");
            WriteArguments(_writer, parameterMapping);
            _writer.Line($"cancellationToken){GetConfigureAwait(async)};");

            WriteLROResponse(GetDiagnosticReference(operation).Name, PipelineProperty, operation, parameterMapping, async);
        }

        protected virtual void WriteLROResponse(string diagnosticsVariableName, string pipelineVariableName, MgmtRestOperation operation, IEnumerable<ParameterMapping> parameterMapping, bool isAsync)
        {
            if (operation.InterimOperation is not null)
            {
                _writer.Append($"var operation = new {operation.InterimOperation.TypeName}");
            }
            else
            {
                _writer.Append($"var operation = new {LibraryArmOperation}");
                if (operation.ReturnType.IsGenericType)
                {
                    _writer.Append($"<{operation.MgmtReturnType}>");
                }
            }
            _writer.Append($"(");
            if (operation.IsFakeLongRunningOperation)
            {
                var valueConverter = operation.GetValueConverter($"{ArmClientReference}", $"{Configuration.ApiTypes.ResponseParameterName}");
                if (valueConverter != null)
                {
                    _writer.Append($"{Configuration.ApiTypes.ResponseType}.FromValue({valueConverter}, {Configuration.ApiTypes.ResponseParameterName}.{Configuration.ApiTypes.GetRawResponseName}())");
                }
                else
                {
                    _writer.Append($"{Configuration.ApiTypes.ResponseParameterName}");
                }
            }
            else
            {
                if (operation.OperationSource is not null)
                {
                    _writer.Append($"new {operation.OperationSource.Type}(")
                        .AppendIf($"{ArmClientReference}", operation.MgmtReturnType is { IsFrameworkType: false, Implementation: Resource })
                        .Append($"), ");
                }

                _writer.Append($"{diagnosticsVariableName}, {pipelineVariableName}, {GetRestClientName(operation)}.{RequestWriterHelpers.CreateRequestMethodName(operation.Method.Name)}(");
                WriteArguments(_writer, parameterMapping);
                _writer.RemoveTrailingComma();
                _writer.Append($").Request, {Configuration.ApiTypes.ResponseParameterName}, {typeof(OperationFinalStateVia)}.{operation.FinalStateVia!},");

                if (Configuration.MgmtConfiguration.OperationsToSkipLroApiVersionOverride.Contains(operation.OperationId))
                {
                    _writer.AppendRaw("skipApiVersionOverride: true,");
                }

                if (Configuration.MgmtConfiguration.OperationsToLroApiVersionOverride.TryGetValue(operation.OperationId, out var apiVersionOverrideValue))
                {
                    _writer.Append($"apiVersionOverrideValue: {apiVersionOverrideValue:L}");
                }
            }
            _writer.RemoveTrailingComma();
            _writer.Line($");");
            var waitForCompletionMethod = operation.MgmtReturnType is null ?
                    "WaitForCompletionResponse" :
                    "WaitForCompletion";
            _writer.Line($"if (waitUntil == {typeof(WaitUntil)}.Completed)");
            _writer.Line($"{GetAwait(isAsync)} operation.{CreateMethodName(waitForCompletionMethod, isAsync)}(cancellationToken){GetConfigureAwait(isAsync)};");
            _writer.Line($"return operation;");
        }
        #endregion

        protected void WriteArguments(CodeWriter writer, IEnumerable<ParameterMapping> mapping, bool passNullForOptionalParameters = false)
        {
            var arguments = GetArguments(writer, mapping, passNullForOptionalParameters);
            if (!arguments.IsEmpty())
            {
                writer.Append(arguments).AppendRaw(", ");
            }
        }

        private static FormattableString GetArguments(CodeWriter writer, IEnumerable<ParameterMapping> mapping, bool passNullForOptionalParameters = false)
        {
            var args = new List<FormattableString>();
            foreach (var parameter in mapping)
            {
                if (parameter.IsPassThru)
                {
                    if (PagingMethod.IsPageSizeName(parameter.Parameter.Name))
                    {
                        // always use the `pageSizeHint` parameter from `AsPages(pageSizeHint)`
                        if (PagingMethod.IsPageSizeType(parameter.Parameter.Type.FrameworkType))
                        {
                            args.Add($"pageSizeHint");
                        }
                        else
                        {
                            Console.Error.WriteLine($"WARNING: Parameter '{parameter.Parameter.Name}' is like a page size parameter, but it's not a numeric type. Fix it or overwrite it if necessary.");
                            if (parameter.Parameter.IsPropertyBag)
                                args.Add($"{parameter.ValueExpression}");
                            else
                                args.Add($"{parameter.Parameter.Name}");
                        }
                    }
                    else
                    {
                        if (passNullForOptionalParameters && parameter.Parameter.Validation == ValidationType.None)
                            args.Add($"null");
                        else if (parameter.Parameter.IsPropertyBag)
                            args.Add($"{parameter.ValueExpression}");
                        else
                            args.Add($"{parameter.Parameter.Name}");
                    }
                }
                else
                {
                    if (parameter.Parameter.Type.IsEnum)
                    {
                        writer.UseNamespace(parameter.Parameter.Type.Namespace);
                    }

                    foreach (var @namespace in parameter.Usings)
                    {
                        writer.UseNamespace(@namespace);
                    }

                    args.Add($"{parameter.ValueExpression}");
                }
            }

            return args.Join(", ");
        }

        public override string ToString()
        {
            return _writer.ToString();
        }
    }
}
