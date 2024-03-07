// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.Models;
using Azure.ResourceManager;

namespace AutoRest.CSharp.Mgmt.Output
{
    internal class ArmResourceExtension : MgmtExtension
    {
        private readonly List<MgmtExtension> _extensions;
        public ArmResourceExtension(IReadOnlyDictionary<RequestPath, IEnumerable<Operation>> armResourceExtensionOperations, IEnumerable<MgmtMockableExtension> extensionClients) : base(Enumerable.Empty<Operation>(), extensionClients, typeof(ArmResource), RequestPath.Any)
        {
            _extensions = new();
            foreach (var (parentRequestPath, operations) in armResourceExtensionOperations)
            {
                _extensions.Add(new(operations, extensionClients, typeof(ArmResource), parentRequestPath));
            }
        }

        protected override IEnumerable<MgmtClientOperation> EnsureClientOperations()
        {
            foreach (var extension in _extensions)
            {
                foreach (var clientOperation in extension.ClientOperations)
                {
                    var requestPaths = clientOperation.Select(restOperation => restOperation.RequestPath);
                    if (ShouldGenerateArmResourceExtensionMethod(requestPaths))
                        yield return clientOperation;
                }
            }
        }

        private static bool ShouldGenerateArmResourceExtensionMethod(IEnumerable<RequestPath> requestPaths)
            => requestPaths.Any(ShouldGenerateArmResourceExtensionMethod);

        private static bool ShouldGenerateArmResourceExtensionMethod(RequestPath requestPath)
            => Configuration.MgmtConfiguration.GenerateArmResourceExtensions.Contains(requestPath);

        /// <summary>
        /// This tracks all resources with a parent of ArmResource
        /// We need this to keep the original data of all possible child resources of ArmResource and we will use it again in ArmClientExtension
        /// </summary>
        internal IEnumerable<Resource> AllChildResources => base.ChildResources;

        private IEnumerable<Resource>? _filteredArmResourceChildResource;
        /// <summary>
        /// We need to filter out some resources here
        /// because in the design of generated code for ArmResourceExtension, we usually do not generate an extension method that extends ArmResource type
        /// instead we generate an extension method of ArmClient with a scope instead to avoid that the extension method shows up on every resource
        /// because in real life it is not quite possible.
        /// </summary>
        public override IEnumerable<Resource> ChildResources => _filteredArmResourceChildResource ??= EnsureArmResourceExtensionChildResources();

        private IEnumerable<Resource> EnsureArmResourceExtensionChildResources()
        {
            foreach (var resource in AllChildResources)
            {
                if (ShouldGenerateArmResourceExtensionMethod(resource.RequestPath))
                    yield return resource;
            }
        }
    }
}
