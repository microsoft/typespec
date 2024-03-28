// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Mgmt.Decorator;
using AutoRest.CSharp.Mgmt.Models;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Shared;
using Azure.Core;
using Azure.ResourceManager;
using AutoRest.CSharp.Common.Output.Expressions.KnownCodeBlocks;

namespace AutoRest.CSharp.Mgmt.Output
{
    internal class ArmClientExtension : MgmtExtension
    {
        private readonly List<MgmtExtension> _extensions;
        private readonly ArmResourceExtension _armResourceExtensionForChildResources;
        public ArmClientExtension(IReadOnlyDictionary<RequestPath, IEnumerable<Operation>> armResourceExtensionOperations, IEnumerable<MgmtMockableExtension> extensionClients, ArmResourceExtension armResourceExtensionForChildResources)
            : base(Enumerable.Empty<Operation>(), extensionClients, typeof(ArmClient), RequestPath.Tenant)
        {
            _armResourceExtensionForChildResources = armResourceExtensionForChildResources;
            _extensions = new();
            foreach (var (parentRequestPath, operations) in armResourceExtensionOperations)
            {
                _extensions.Add(new(operations, extensionClients, typeof(ArmResource), parentRequestPath));
            }
        }

        public override bool IsEmpty => !MgmtContext.Library.ArmResources.Any() && base.IsEmpty;

        protected override string VariableName => Configuration.MgmtConfiguration.IsArmCore ? "this" : "client";

        public override FormattableString IdVariableName => $"scope";
        public override FormattableString BranchIdVariableName => $"scope";

        protected override IEnumerable<MgmtClientOperation> EnsureClientOperations()
        {
            var extensionParamToUse = Configuration.MgmtConfiguration.IsArmCore ? null : ExtensionParameter;
            foreach (var extension in _extensions)
            {
                foreach (var clientOperation in extension.ClientOperations)
                {
                    var requestPaths = clientOperation.Select(restOperation => restOperation.RequestPath);
                    var scopeResourceTypes = requestPaths.Select(requestPath => requestPath.GetParameterizedScopeResourceTypes() ?? Enumerable.Empty<ResourceTypeSegment>()).SelectMany(types => types).Distinct();
                    var scopeTypes = ResourceTypeBuilder.GetScopeTypeStrings(scopeResourceTypes);
                    var parameterOverride = clientOperation.MethodParameters.Skip(1).Prepend(GetScopeParameter(scopeTypes)).Prepend(ExtensionParameter).ToArray();
                    var newOp = MgmtClientOperation.FromClientOperation(clientOperation, IdVariableName, extensionParameter: extensionParamToUse, parameterOverride: parameterOverride);
                    yield return newOp;
                }
            }
        }

        // only when in usual packages other than arm core, we need to generate the ArmClient, scope pattern for those scope resources
        public override IEnumerable<Resource> ChildResources => Configuration.MgmtConfiguration.IsArmCore ? Enumerable.Empty<Resource>() : _armResourceExtensionForChildResources.AllChildResources;

        private readonly Parameter _scopeParameter = new Parameter(
                Name: "scope",
                Description: $"The scope that the resource will apply against.",
                Type: typeof(ResourceIdentifier),
                DefaultValue: null,
                Validation: ValidationType.None,
                Initializer: null);

        private Parameter GetScopeParameter(ICollection<FormattableString>? types)
        {
            if (types == null)
                return _scopeParameter;

            return _scopeParameter with
            {
                Description = $"{_scopeParameter.Description} Expected resource type includes the following: {types.Join(", ", " or ")}"
            };
        }

        protected override Method BuildMockableExtensionFactoryMethod()
        {
            var signature = new MethodSignature(
                MockableExtension.FactoryMethodName,
                null,
                null,
                MethodSignatureModifiers.Private | MethodSignatureModifiers.Static,
                MockableExtension.Type,
                null,
                new[]
                {
                    KnownParameters.ArmClient with { Validation = ValidationType.AssertNotNull }
                });

            var extensionVariable = (ValueExpression)KnownParameters.ArmClient;
            var clientVariable = new VariableReference(typeof(ArmClient), "client");
            var body = Snippets.Return(
                extensionVariable.Invoke(nameof(ArmClient.GetCachedClient),
                new FuncExpression(new[] { clientVariable.Declaration }, Snippets.New.Instance(MockableExtension.Type, clientVariable))
                ));
            return new(signature, body);
        }

        protected override Method BuildGetSingletonResourceMethod(Resource resource)
        {
            var originalMethod = base.BuildGetSingletonResourceMethod(resource);
            if (IsArmCore)
                return originalMethod;

            // we need to add a scope parameter inside the method signature
            var originalSignature = (MethodSignature)originalMethod.Signature;
            var scopeTypes = ResourceTypeBuilder.GetScopeTypeStrings(resource.RequestPath.GetParameterizedScopeResourceTypes());
            var parameters = new List<Parameter>()
            {
                // add the first parameter, which is the extension parameter
                originalSignature.Parameters[0],
                // then we add the scope parameter
                GetScopeParameter(scopeTypes)
            };
            parameters.AddRange(originalSignature.Parameters.Skip(1)); // add all remaining parameters
            var signatureOnMockingExtension = originalSignature with
            {
                Modifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual,
                Parameters = parameters.Skip(1).ToArray()
            };
            var signature = originalSignature with
            {
                Description = $"{BuildDescriptionForSingletonResource(resource)}{Environment.NewLine}{BuildMockingExtraDescription(signatureOnMockingExtension)}",
                Parameters = parameters
            };

            return BuildRedirectCallToMockingExtension(signature, signatureOnMockingExtension);
        }

        protected override Method BuildGetChildCollectionMethod(ResourceCollection collection)
        {
            var originalMethod = base.BuildGetChildCollectionMethod(collection);
            if (IsArmCore)
                return originalMethod;

            // we need to add a scope parameter inside the method signature
            var originalSignature = (MethodSignature)originalMethod.Signature;
            var scopeTypes = ResourceTypeBuilder.GetScopeTypeStrings(collection.RequestPath.GetParameterizedScopeResourceTypes());
            var parameters = new List<Parameter>()
            {
                // add the first parameter, which is the extension parameter
                originalSignature.Parameters[0],
                // then we add the scope parameter
                GetScopeParameter(scopeTypes)
            };
            parameters.AddRange(originalSignature.Parameters.Skip(1)); // add all remaining parameters
            var signatureOnMockingExtension = originalSignature with
            {
                Modifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual,
                Parameters = parameters.Skip(1).ToArray()
            };
            var signature = originalSignature with
            {
                Description = $"{BuildDescriptionForChildCollection(collection)}{Environment.NewLine}{BuildMockingExtraDescription(signatureOnMockingExtension)}",
                Parameters = parameters
            };

            return BuildRedirectCallToMockingExtension(signature, signatureOnMockingExtension);
        }

        private IEnumerable<Method>? _armResourceMethods;
        public IEnumerable<Method> ArmResourceMethods => _armResourceMethods ??= BuildArmResourceMethods();

        private IEnumerable<Method> BuildArmResourceMethods()
        {
            foreach (var resource in MgmtContext.Library.ArmResources)
            {
                yield return BuildArmResourceMethod(resource);
            }
        }

        private Method BuildArmResourceMethod(Resource resource)
        {
            var lines = new List<FormattableString>();
            string an = resource.Type.Name.StartsWithVowel() ? "an" : "a";
            lines.Add($"Gets an object representing {an} <see cref=\"{resource.Type}\" /> along with the instance operations that can be performed on it but with no data.");
            lines.Add($"You can use <see cref=\"{resource.Type}.CreateResourceIdentifier\" /> to create {an} <see cref=\"{resource.Type}\" /> <see cref=\"{typeof(ResourceIdentifier)}\" /> from its components.");
            var description = FormattableStringHelpers.Join(lines, Environment.NewLine);

            var parameters = new List<Parameter>
            {
                _resourceIdParameter
            };

            var signatureOnMockingExtension = new MethodSignature(
                $"Get{resource.Type.Name}",
                null,
                description,
                MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual,
                resource.Type,
                $"Returns a {resource.Type:C} object.",
                parameters);

            if (IsArmCore)
            {
                var methodBody = new MethodBodyStatement[]{
                    new InvokeStaticMethodStatement(resource.Type, "ValidateResourceId", _resourceIdParameter),
                    Snippets.Return(Snippets.New.Instance(resource.Type, Snippets.This, _resourceIdParameter))
                };

                return new(signatureOnMockingExtension, methodBody);
            }
            else
            {
                var signature = signatureOnMockingExtension with
                {
                    Description = $"{description}{Environment.NewLine}{BuildMockingExtraDescription(signatureOnMockingExtension)}",
                    Modifiers = MethodModifiers,
                    Parameters = parameters.Prepend(ExtensionParameter).ToArray()
                };

                return BuildRedirectCallToMockingExtension(signature, signatureOnMockingExtension);
            }
        }

        private readonly Parameter _resourceIdParameter = new(
            Name: "id",
            Description: $"The resource ID of the resource to get.",
            Type: typeof(ResourceIdentifier),
            DefaultValue: null,
            Validation: ValidationType.None,
            Initializer: null);
    }
}
