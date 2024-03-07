// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Mgmt.Models;
using AutoRest.CSharp.Mgmt.Output;
using AutoRest.CSharp.Output.Models.Requests;
using Azure;
using static AutoRest.CSharp.Mgmt.Decorator.ParameterMappingBuilder;

namespace AutoRest.CSharp.Mgmt.Generation
{
    /// <summary>
    /// Code writer for resource collection.
    /// A resource collection should have 3 operations:
    /// 1. CreateOrUpdate (2 variants)
    /// 2. Get (2 variants)
    /// 3. List (2 variants)
    /// </summary>
    internal class ResourceCollectionWriter : MgmtClientBaseWriter
    {
        private ResourceCollection This { get; }

        public ResourceCollectionWriter(ResourceCollection resourceCollection) : this(new CodeWriter(), resourceCollection)
        {
        }

        protected ResourceCollectionWriter(CodeWriter writer, ResourceCollection resourceCollection)
            : base(writer, resourceCollection)
        {
            This = resourceCollection;
            _customMethods.Add(nameof(WriteExistsBody), WriteExistsBody);
            _customMethods.Add(nameof(WriteGetIfExistsBody), WriteGetIfExistsBody);
        }

        protected override void WriteProperties()
        {
            // we put this method inside this method just because we are trying to preserve their existing sequence
            var allPossibleTypes = This.ResourceTypes.SelectMany(p => p.Value).Distinct();

            FormattableString validResourceType = allPossibleTypes.Count() == 1
                ? validResourceType = GetResourceTypeExpression(allPossibleTypes.First())
                : validResourceType = $"{typeof(Azure.Core.ResourceIdentifier)}.Root.ResourceType";
            _writer.Line();

            if (allPossibleTypes.Count() == 1)
                WriteStaticValidate(validResourceType);
        }

        private void WriteExistsBody(MgmtClientOperation clientOperation, Diagnostic diagnostic, bool async)
        {
            using (_writer.WriteDiagnosticScope(diagnostic, GetDiagnosticReference(clientOperation.OperationMappings.Values.First())))
            {
                var operation = clientOperation.OperationMappings.Values.First();
                var response = new CodeWriterDeclaration(Configuration.ApiTypes.ResponseParameterName);
                _writer
                    .Append($"var {response:D} = {GetAwait(async)} ")
                    .Append($"{GetRestClientName(operation)}.{CreateMethodName(operation.Method.Name, async)}(");
                WriteArguments(_writer, clientOperation.ParameterMappings.Values.First());
                _writer.Line($"cancellationToken: cancellationToken){GetConfigureAwait(async)};");
                _writer.Line($"return {Configuration.ApiTypes.ResponseType}.FromValue({Configuration.ApiTypes.ResponseParameterName}.Value != null, {Configuration.ApiTypes.ResponseParameterName}.{Configuration.ApiTypes.GetRawResponseName}());");
            }
        }

        private void WriteGetIfExistsBody(MgmtClientOperation clientOperation, Diagnostic diagnostic, bool async)
        {
            using (_writer.WriteDiagnosticScope(diagnostic, GetDiagnosticReference(clientOperation.OperationMappings.Values.First())))
            {
                // we need to write multiple branches for a normal method
                if (clientOperation.OperationMappings.Count == 1)
                {
                    // if we only have one branch, we would not need those if-else statements
                    var branch = clientOperation.OperationMappings.Keys.First();
                    WriteGetMethodBranch(_writer, clientOperation.OperationMappings[branch], clientOperation.ParameterMappings[branch], async);
                }
                else
                {
                    // branches go here
                    throw new NotImplementedException("multi-branch normal method not supported yet");
                }
            }
        }

        private void WriteGetMethodBranch(CodeWriter writer, MgmtRestOperation operation, IEnumerable<ParameterMapping> parameterMappings, bool async)
        {
            var response = new CodeWriterDeclaration(Configuration.ApiTypes.ResponseParameterName);
            writer
                .Append($"var {response:D} = {GetAwait(async)} ")
                .Append($"{GetRestClientName(operation)}.{CreateMethodName(operation.Method.Name, async)}(");
            WriteArguments(writer, parameterMappings);
            writer.Line($"cancellationToken: cancellationToken){GetConfigureAwait(async)};");

            writer.Line($"if ({response}.Value == null)");
            writer.Line($"return new {new CSharpType(typeof(NoValueResponse<>), operation.MgmtReturnType!)}({response}.{Configuration.ApiTypes.GetRawResponseName}());");

            if (This.Resource.ResourceData.ShouldSetResourceIdentifier)
            {
                writer.Line($"{response}.Value.Id = {CreateResourceIdentifierExpression(This.Resource, operation.RequestPath, parameterMappings, $"{response}.Value")};");
            }

            writer.Line($"return {Configuration.ApiTypes.ResponseType}.FromValue(new {operation.MgmtReturnType}({ArmClientReference}, {response}.Value), {response}.{Configuration.ApiTypes.GetRawResponseName}());");
        }
    }
}
