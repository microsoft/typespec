// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;
using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions.Azure;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Mgmt.Decorator;
using AutoRest.CSharp.Mgmt.Models;
using AutoRest.CSharp.Mgmt.Output;
using AutoRest.CSharp.Output.Models.Shared;
using Azure.Core;

namespace AutoRest.CSharp.Mgmt.Generation
{
    internal sealed class MockableArmClientWriter : MgmtMockableExtensionWriter
    {
        private readonly Parameter _scopeParameter;
        private MgmtMockableArmClient This { get; }

        public MockableArmClientWriter(MgmtMockableArmClient extensionClient) : base(extensionClient)
        {
            This = extensionClient;
            _scopeParameter = new Parameter(
                Name: "scope",
                Description: $"The scope that the resource will apply against.",
                Type: typeof(ResourceIdentifier),
                DefaultValue: null,
                Validation: ValidationType.AssertNotNull,
                Initializer: null);
        }

        protected override void WriteCtors()
        {
            base.WriteCtors();

            if (This.ArmClientCtor is { } armClientCtor)
            {
                // for ArmClientExtensionClient, we write an extra ctor that only takes ArmClient as parameter
                var ctor = armClientCtor with
                {
                    Parameters = new[] { KnownParameters.ArmClient },
                    Initializer = new(false, new ValueExpression[] { KnownParameters.ArmClient, ResourceIdentifierExpression.Root })
                };

                using (_writer.WriteMethodDeclaration(ctor))
                {
                    // it does not need a body
                }
            }
        }

        protected internal override void WriteImplementations()
        {
            base.WriteImplementations();

            foreach (var method in This.ArmResourceMethods)
            {
                _writer.WriteMethodDocumentation(method.Signature);
                _writer.WriteMethod(method);
            }
        }

        protected override IDisposable WriteCommonMethod(MgmtClientOperation clientOperation, bool isAsync)
        {
            var originalSignature = clientOperation.MethodSignature;
            var signature = originalSignature with
            {
                Parameters = originalSignature.Parameters.Prepend(_scopeParameter).ToArray()
            };
            _writer.Line();
            var returnDescription = clientOperation.ReturnsDescription?.Invoke(isAsync);
            return _writer.WriteCommonMethod(signature, returnDescription, isAsync, This.Accessibility == "public", SkipParameterValidation);
        }

        protected override WriteMethodDelegate GetMethodDelegate(bool isLongRunning, bool isPaging)
        {
            var writeBody = base.GetMethodDelegate(isLongRunning, isPaging);
            return (clientOperation, diagnostic, isAsync) =>
            {
                var requestPaths = clientOperation.Select(restOperation => restOperation.RequestPath);
                var scopeResourceTypes = requestPaths.Select(requestPath => requestPath.GetParameterizedScopeResourceTypes() ?? Enumerable.Empty<ResourceTypeSegment>()).SelectMany(types => types).Distinct();
                var scopeTypes = ResourceTypeBuilder.GetScopeTypeStrings(scopeResourceTypes);

                WriteScopeResourceTypesValidation(_scopeParameter.Name, scopeTypes);

                writeBody(clientOperation, diagnostic, isAsync);
            };
        }

        private void WriteScopeResourceTypesValidation(string parameterName, ICollection<FormattableString>? types)
        {
            if (types == null)
                return;
            // validate the scope types
            var typeAssertions = types.Select(type => (FormattableString)$"!{parameterName:I}.ResourceType.Equals(\"{type}\")").ToArray();
            var assertion = typeAssertions.Join(" || ");
            using (_writer.Scope($"if ({assertion})"))
            {
                _writer.Line($"throw new {typeof(ArgumentException)}({typeof(string)}.{nameof(string.Format)}(\"Invalid resource type {{0}} expected {types.Join(", ", " or ")}\", {parameterName:I}.ResourceType));");
            }
        }
    }
}
