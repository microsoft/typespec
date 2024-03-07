// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;
using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions.Azure;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Mgmt.Decorator;
using AutoRest.CSharp.Mgmt.Models;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Shared;
using Azure.Core;
using static AutoRest.CSharp.Common.Output.Models.Snippets;

namespace AutoRest.CSharp.Mgmt.Output
{
    internal class MgmtMockableArmClient : MgmtMockableExtension
    {
        public MgmtMockableArmClient(CSharpType resourceType, IEnumerable<MgmtClientOperation> operations, MgmtExtension? extensionForChildResources) : base(resourceType, operations, extensionForChildResources)
        {
        }

        public override FormattableString IdVariableName => $"scope";

        public override FormattableString BranchIdVariableName => $"scope";

        public override bool IsEmpty => !ClientOperations.Any() && !MgmtContext.Library.ArmResources.Any();

        protected override Method BuildGetSingletonResourceMethod(Resource resource)
        {
            var originalMethod = base.BuildGetSingletonResourceMethod(resource);
            if (IsArmCore)
                return originalMethod;

            // we need to add a scope parameter inside the method signature
            var originalSignature = (MethodSignature)originalMethod.Signature;
            var signature = originalSignature with
            {
                Parameters = originalSignature.Parameters.Prepend(_scopeParameter).ToArray()
            };

            var scopeTypes = resource.RequestPath.GetParameterizedScopeResourceTypes();
            var methodBody = new MethodBodyStatement[]
            {
                BuildScopeResourceTypeValidations(scopeTypes),
                Snippets.Return(
                    Snippets.New.Instance(resource.Type, ArmClientProperty, resource.SingletonResourceIdSuffix!.BuildResourceIdentifier(_scopeParameter)))
            };

            return new(signature, methodBody);
        }

        protected override Method BuildGetChildCollectionMethod(ResourceCollection collection)
        {
            var originalMethod = base.BuildGetChildCollectionMethod(collection);
            if (IsArmCore)
                return originalMethod;

            // we need to add a scope parameter inside the method signature
            var originalSignature = (MethodSignature)originalMethod.Signature;
            var signature = originalSignature with
            {
                Parameters = originalSignature.Parameters.Prepend(_scopeParameter).ToArray()
            };

            var scopeTypes = collection.RequestPath.GetParameterizedScopeResourceTypes();
            var ctorArguments = new List<ValueExpression>
            {
                ArmClientProperty,
                _scopeParameter
            };
            ctorArguments.AddRange(originalSignature.Parameters.Select(p => (ValueExpression)p));
            var methodBody = new MethodBodyStatement[]
            {
                BuildScopeResourceTypeValidations(scopeTypes),
                Snippets.Return(
                    Snippets.New.Instance(collection.Type, ctorArguments.ToArray()))
            };

            return new(signature, methodBody);
        }

        private MethodBodyStatement BuildScopeResourceTypeValidations(ResourceTypeSegment[]? scopeTypes)
        {
            if (scopeTypes is null || !scopeTypes.Any() || scopeTypes.Contains(ResourceTypeSegment.Any))
            {
                return EmptyStatement;
            }

            var resourceTypeVariable = new ResourceIdentifierExpression(_scopeParameter).ResourceType;
            var conditions = new List<BoolExpression>();
            var resourceTypeStrings = new List<FormattableString>();
            foreach (var type in scopeTypes)
            {
                // here we have an expression of `!scope.ResourceType.Equals("<type>")`
                conditions.Add(Not(resourceTypeVariable.InvokeEquals(Literal(type.ToString()))));
                resourceTypeStrings.Add($"{type}");
            }

            // here we aggregate them together using or operator || and get: scope.ResourceType.Equals("<type1>") || scope.ResourceType.Equals("<type2>")
            var condition = conditions.Aggregate((a, b) => a.Or(b));
            var errorMessageFormat = $"Invalid resource type {{0}}, expected {resourceTypeStrings.Join(", ", " or ")}";
            return new IfStatement(condition)
            {
                Throw(New.Instance(typeof(ArgumentException), new InvokeStaticMethodExpression(typeof(string), nameof(string.Format), new ValueExpression[] { Literal(errorMessageFormat), resourceTypeVariable })))
            };
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
            lines.Add($"Gets an object representing {an} {resource.Type:C} along with the instance operations that can be performed on it but with no data.");
            lines.Add($"You can use <see cref=\"{resource.Type}.CreateResourceIdentifier\" /> to create {an} {resource.Type:C} {typeof(ResourceIdentifier):C} from its components.");
            var description = FormattableStringHelpers.Join(lines, Environment.NewLine);

            var parameters = new List<Parameter>
            {
                _resourceIdParameter
            };

            var signature = new MethodSignature(
                $"Get{resource.Type.Name}",
                null,
                description,
                MethodModifiers,
                resource.Type,
                $"Returns a {resource.Type:C} object.",
                parameters);

            var methodBody = new MethodBodyStatement[]{
                    new InvokeStaticMethodStatement(resource.Type, "ValidateResourceId", _resourceIdParameter),
                    Snippets.Return(Snippets.New.Instance(resource.Type, ArmClientProperty, _resourceIdParameter))
                };

            return new(signature, methodBody);
        }

        private readonly Parameter _resourceIdParameter = new(
            Name: "id",
            Description: $"The resource ID of the resource to get.",
            Type: typeof(ResourceIdentifier),
            DefaultValue: null,
            Validation: ValidationType.None,
            Initializer: null);

        private readonly Parameter _scopeParameter = new Parameter(
            Name: "scope",
            Description: $"The scope that the resource will apply against.",
            Type: typeof(ResourceIdentifier),
            DefaultValue: null,
            Validation: ValidationType.None,
            Initializer: null);
    }
}
