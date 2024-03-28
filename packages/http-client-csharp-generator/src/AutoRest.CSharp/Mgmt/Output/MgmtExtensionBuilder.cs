// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

using System;
using System.Collections.Generic;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.Models;
using AutoRest.CSharp.Utilities;
using Azure.ResourceManager;

namespace AutoRest.CSharp.Mgmt.Output
{
    internal class MgmtExtensionBuilder
    {
        private record MgmtExtensionInfo(IReadOnlyDictionary<CSharpType, MgmtExtension> ExtensionDict, IEnumerable<MgmtMockableExtension> MockableExtensions)
        {
            private IEnumerable<MgmtExtension>? _extensions;
            public IEnumerable<MgmtExtension> Extensions => _extensions ??= ExtensionDict.Values;

            private MgmtExtensionWrapper? _extensionWrapper;
            public MgmtExtensionWrapper ExtensionWrapper => _extensionWrapper ??= new MgmtExtensionWrapper(Extensions, MockableExtensions);
        }

        private readonly IReadOnlyDictionary<Type, IEnumerable<Operation>> _extensionOperations;
        private readonly IReadOnlyDictionary<RequestPath, IEnumerable<Operation>> _armResourceExtensionOperations;

        public MgmtExtensionBuilder(Dictionary<Type, IEnumerable<Operation>> extensionOperations, Dictionary<RequestPath, IEnumerable<Operation>> armResourceExtensionOperations)
        {
            _extensionOperations = extensionOperations;
            _armResourceExtensionOperations = armResourceExtensionOperations;
        }

        public MgmtExtensionWrapper ExtensionWrapper => ExtensionInfo.ExtensionWrapper;

        public IEnumerable<MgmtExtension> Extensions => ExtensionInfo.Extensions;

        public IEnumerable<MgmtMockableExtension> MockableExtensions => ExtensionInfo.MockableExtensions;

        public MgmtExtension GetExtension(Type armCoreType)
        {
            return ExtensionInfo.ExtensionDict[armCoreType];
        }

        private MgmtExtensionInfo? _info;
        private MgmtExtensionInfo ExtensionInfo => _info ??= EnsureMgmtExtensionInfo();

        private MgmtExtensionInfo EnsureMgmtExtensionInfo()
        {
            // we use a SortedDictionary or SortedSet here to make sure the order of extensions or extension clients is deterministic
            var extensionDict = new SortedDictionary<CSharpType, MgmtExtension>(new CSharpTypeNameComparer());
            var mockingExtensions = new SortedSet<MgmtMockableExtension>(new MgmtExtensionClientComparer());
            // create the extensions
            foreach (var (type, operations) in _extensionOperations)
            {
                var extension = new MgmtExtension(operations, mockingExtensions, type);
                extensionDict.Add(type, extension);
            }
            // add ArmResourceExtension methods
            var armResourceExtension = new ArmResourceExtension(_armResourceExtensionOperations, mockingExtensions);
            // add ArmClientExtension methods (which is also the TenantResource extension methods)
            var armClientExtension = new ArmClientExtension(_armResourceExtensionOperations, mockingExtensions, armResourceExtension);
            extensionDict.Add(typeof(ArmResource), armResourceExtension);
            extensionDict.Add(typeof(ArmClient), armClientExtension);

            // construct all possible extension clients
            // first we collection all possible combinations of the resource on operations
            var resourceToOperationsDict = new Dictionary<CSharpType, List<MgmtClientOperation>>();
            foreach (var (type, extension) in extensionDict)
            {
                // we add an empty list for the type to ensure that the corresponding extension client will always be constructed, even empty
                resourceToOperationsDict.Add(type, new());
                foreach (var operation in extension.AllOperations)
                {
                    resourceToOperationsDict.AddInList(type, operation);
                }
            }
            // then we construct the extension clients
            foreach (var (resourceType, operations) in resourceToOperationsDict)
            {
                // find the extension if the resource type here is a framework type (when it is ResourceGroupResource, SubscriptionResource, etc) to ensure the ExtensionClient could property have the child resources
                extensionDict.TryGetValue(resourceType, out var extensionForChildResources);
                var extensionClient = resourceType.Equals(typeof(ArmClient)) ?
                    new MgmtMockableArmClient(resourceType, operations, extensionForChildResources) :
                    new MgmtMockableExtension(resourceType, operations, extensionForChildResources);
                mockingExtensions.Add(extensionClient);
            }

            return new(extensionDict, mockingExtensions);
        }

        private struct CSharpTypeNameComparer : IComparer<CSharpType>
        {
            public int Compare(CSharpType? x, CSharpType? y)
            {
                return string.Compare(x?.Name, y?.Name);
            }
        }

        private struct MgmtExtensionClientComparer : IComparer<MgmtMockableExtension>
        {
            public int Compare(MgmtMockableExtension? x, MgmtMockableExtension? y)
            {
                return string.Compare(x?.Declaration.Name, y?.Declaration.Name);
            }
        }
    }
}
