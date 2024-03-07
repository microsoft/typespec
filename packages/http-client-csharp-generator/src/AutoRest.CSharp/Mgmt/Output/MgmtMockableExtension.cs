// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Mgmt.Decorator;
using AutoRest.CSharp.Mgmt.Models;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Utilities;
using Azure.ResourceManager;
using static AutoRest.CSharp.Output.Models.MethodSignatureModifiers;

namespace AutoRest.CSharp.Mgmt.Output
{
    internal class MgmtMockableExtension : MgmtTypeProvider
    {
        private readonly IEnumerable<MgmtClientOperation> _operations;
        private readonly MgmtExtension? _extensionForChildResources;

        public MgmtMockableExtension(CSharpType resourceType, IEnumerable<MgmtClientOperation> operations, MgmtExtension? extensionForChildResources)
            : base(resourceType.Name)
        {
            _operations = operations;
            _extensionForChildResources = extensionForChildResources;
            ExtendedResourceType = resourceType;
            // name of this class is like "MockableComputeResourceGroupResource"
            DefaultName = GetMockableExtensionDefaultName(resourceType.Name);
        }

        internal static string GetMockableExtensionDefaultName(string resourceName)
            => $"Mockable{MgmtContext.RPName}{resourceName}";

        public override bool IsInitializedByProperties => true;

        protected override ConstructorSignature? EnsureArmClientCtor()
        {
            return new ConstructorSignature(
                Type,
                Summary: null,
                Description: $"Initializes a new instance of the {Type:C} class.",
                Modifiers: Internal,
                Parameters: new[] { KnownParameters.ArmClient, ResourceIdentifierParameter },
                Initializer: new(
                    isBase: true,
                    arguments: new[] { KnownParameters.ArmClient, ResourceIdentifierParameter }));
        }

        private string? _factoryMethodName;
        public string FactoryMethodName => _factoryMethodName ??= $"Get{Declaration.Name}";

        protected override IEnumerable<MgmtClientOperation> EnsureClientOperations()
        {
            // here we have to capsulate the MgmtClientOperation again to remove the extra "extension parameter" we added when constructing them in MgmtExtension.EnsureClientOperations
            // and here we need to regroup these MgmtClientOperations when they cannot be overloard of each other
            var operationDict = new Dictionary<string, List<MgmtClientOperation>>();
            foreach (var operation in _operations)
            {
                operationDict.AddInList(GetMgmtClientOperationKey(operation.MethodSignature), operation);
            }

            foreach (var (_, operations) in operationDict)
            {
                yield return MgmtClientOperation.FromOperations(operations.SelectMany(clientOperation => clientOperation).ToList(), IdVariableName)!;
            }
        }

        public override ResourceTypeSegment GetBranchResourceType(RequestPath branch)
        {
            return branch.GetResourceType();
        }

        public CSharpType ExtendedResourceType { get; }

        public override CSharpType? BaseType => typeof(ArmResource);

        protected override string DefaultName { get; }
        protected override string DefaultNamespace => $"{base.DefaultNamespace}.Mocking";

        public override string DiagnosticNamespace => base.DefaultNamespace;

        public virtual bool IsEmpty => !ClientOperations.Any() && !ChildResources.Any();

        public override IEnumerable<Resource> ChildResources => _extensionForChildResources?.ChildResources ?? Enumerable.Empty<Resource>();

        private FormattableString? _description;
        public override FormattableString Description => _description ??= $"A class to add extension methods to {ResourceName}.";

        protected override string DefaultAccessibility => "public";

        /// <summary>
        /// Construct a key for overload of this method signature.
        /// The format of this key is like "MethodName(TypeOfParameter1,TypeOfParameter2,...,TypeOfLastParameter)"
        /// </summary>
        /// <param name="methodSignature"></param>
        /// <returns></returns>
        private static string GetMgmtClientOperationKey(MethodSignature methodSignature)
        {
            var builder = new StringBuilder();
            builder.Append(methodSignature.Name).Append("(");
            // all methods here should be extension methods, therefore we skip the first parameter which is the extension method parameter "this" and in this context, it is actually myself
            builder.AppendJoin(',', methodSignature.Parameters.Skip(1).Select(p => p.Type.Name));
            builder.Append(")");

            return builder.ToString();
        }
    }
}
