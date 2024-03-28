// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Mgmt.Models;
using AutoRest.CSharp.Mgmt.Output;
using Azure.ResourceManager;
using Azure.ResourceManager.ManagementGroups;
using Azure.ResourceManager.Resources;

namespace AutoRest.CSharp.Mgmt.Decorator
{
    internal static class ParentDetection
    {
        private static ConcurrentDictionary<RequestPath, RequestPath> _requestPathToParentCache = new ConcurrentDictionary<RequestPath, RequestPath>();
        private static ConcurrentDictionary<Operation, RequestPath> _operationToParentRequestPathCache = new ConcurrentDictionary<Operation, RequestPath>();

        private static ConcurrentDictionary<MgmtTypeProvider, IEnumerable<MgmtTypeProvider>> _resourceParentCache = new ConcurrentDictionary<MgmtTypeProvider, IEnumerable<MgmtTypeProvider>>();

        /// <summary>
        /// Returns the collection of the parent of the given resource.
        /// This is not initialized while the TypeProviders are constructing and can only be used in the writers.
        /// </summary>
        /// <param name="resource"></param>
        /// <returns></returns>
        public static IEnumerable<MgmtTypeProvider> GetParents(this Resource resource)
        {
            if (_resourceParentCache.TryGetValue(resource, out var parentList))
                return parentList;

            parentList = resource.DoGetParents();
            _resourceParentCache.TryAdd(resource, parentList);
            return parentList;
        }

        private static IEnumerable<MgmtTypeProvider> DoGetParents(this Resource resource)
        {
            var scope = resource.RequestPath.GetScopePath();
            var resourceOperationSet = resource.OperationSet;
            var parentRequestPath = resourceOperationSet.ParentRequestPath(resource.ResourceType);

            if (parentRequestPath.Equals(resourceOperationSet.GetRequestPath()))
            {
                // my parent is myself? Only tenant has this attribute, return empty
                return Enumerable.Empty<MgmtTypeProvider>();
            }
            // if the scope of this request path is parameterized, and the direct parent path we get from the resource list is parent of the scope, we return the scope as its parent since the scope here is a child
            // if the request path is a "by id" path, its scope is the same as itself, therefore this condition here is nullified and should be skipped
            if (!resource.RequestPath.IsById && scope.IsParameterizedScope() && (parentRequestPath.IsAncestorOf(scope) || parentRequestPath == scope))
            {
                // we already verified that the scope is parameterized, therefore we assert the type can never be null
                var types = resource.RequestPath.GetParameterizedScopeResourceTypes()!;
                return FindScopeParents(types).Distinct();
            }

            if (MgmtContext.Library.TryGetArmResource(parentRequestPath, out var parent))
            {
                return parent.AsIEnumerable();
            }
            // if we cannot find a resource as its parent, its parent must be one of the Extensions
            if (parentRequestPath.Equals(RequestPath.ManagementGroup))
                return MgmtContext.Library.GetExtension(typeof(ManagementGroupResource)).AsIEnumerable();
            if (parentRequestPath.Equals(RequestPath.ResourceGroup))
                return MgmtContext.Library.GetExtension(typeof(ResourceGroupResource)).AsIEnumerable();
            if (parentRequestPath.Equals(RequestPath.Subscription))
                return MgmtContext.Library.GetExtension(typeof(SubscriptionResource)).AsIEnumerable();
            // the only option left is the tenant. But we have our last chance that its parent could be the scope of this
            scope = parentRequestPath.GetScopePath(); // we do this because some request path its scope is the same as itself
            if (scope.IsParameterizedScope())
            {
                // we already verified that the scope is parameterized, therefore we assert the type can never be null
                var types = resource.RequestPath.GetParameterizedScopeResourceTypes()!;
                return FindScopeParents(types).Distinct();
            }
            // otherwise we use the tenant as a fallback
            return MgmtContext.Library.GetExtension(typeof(TenantResource)).AsIEnumerable();
        }

        // TODO -- enhence this to support the new arm-id format
        private static IEnumerable<MgmtTypeProvider> FindScopeParents(ResourceTypeSegment[] parameterizedScopeTypes)
        {
            if (parameterizedScopeTypes.Contains(ResourceTypeSegment.Any))
            {
                yield return MgmtContext.Library.GetExtension(typeof(ArmResource));
                yield break;
            }

            foreach (var type in parameterizedScopeTypes)
            {
                if (type == ResourceTypeSegment.ManagementGroup)
                    yield return MgmtContext.Library.GetExtension(typeof(ManagementGroupResource));
                else if (type == ResourceTypeSegment.ResourceGroup)
                    yield return MgmtContext.Library.GetExtension(typeof(ResourceGroupResource));
                else if (type == ResourceTypeSegment.Subscription)
                    yield return MgmtContext.Library.GetExtension(typeof(SubscriptionResource));
                else if (type == ResourceTypeSegment.Tenant)
                    yield return MgmtContext.Library.GetExtension(typeof(TenantResource));
                else
                    yield return MgmtContext.Library.GetExtension(typeof(ArmResource)); // we return anything unrecognized scope parent resource type as ArmResourceExtension
            }
        }

        public static RequestPath ParentRequestPath(this OperationSet operationSet, ResourceTypeSegment resourceTypeHint)
        {
            // escape the calculation if this is configured in the configuration
            if (Configuration.MgmtConfiguration.RequestPathToParent.TryGetValue(operationSet.RequestPath, out var rawPath))
                return GetRequestPathFromRawPath(rawPath);

            return operationSet.GetRequestPath(resourceTypeHint).ParentRequestPath();
        }

        private static RequestPath GetRequestPathFromRawPath(string rawPath)
        {
            var parentSet = MgmtContext.Library.GetOperationSet(rawPath);
            return parentSet.GetRequestPath();
        }

        /// <summary>
        /// This method gives the proper grouping of the given operation by testing the following:
        /// 1. If this operation comes from a resource operation set, return the request path of the resource
        /// 2. If this operation is a collection operation of a resource, return the request path of the resource
        /// 3. If neither of above meets, return the parent request path of an existing resource
        /// </summary>
        /// <param name="operation"></param>
        /// <returns></returns>
        public static RequestPath ParentRequestPath(this Operation operation)
        {
            if (_operationToParentRequestPathCache.TryGetValue(operation, out var result))
                return result;

            result = operation.GetParentRequestPath();
            _operationToParentRequestPathCache.TryAdd(operation, result);
            return result;
        }

        private static RequestPath GetParentRequestPath(this Operation operation)
        {
            // escape the calculation if this is configured in the configuration
            if (Configuration.MgmtConfiguration.RequestPathToParent.TryGetValue(operation.GetHttpPath(), out var rawPath))
                return GetRequestPathFromRawPath(rawPath);

            var currentRequestPath = operation.GetRequestPath();
            var currentOperationSet = MgmtContext.Library.GetOperationSet(currentRequestPath);
            // if this operation comes from a resource, return itself
            if (currentOperationSet.IsResource())
                return currentRequestPath;

            // if this operation corresponds to a collection operation of a resource, return the path of the resource
            if (operation.IsResourceCollectionOperation(out var operationSetOfResource))
                return operationSetOfResource.GetRequestPath();

            // if neither of the above, we find a request path that is the longest parent of this, and belongs to a resource
            return currentRequestPath.ParentRequestPath();
        }

        internal static RequestPath ParentRequestPath(this RequestPath requestPath)
        {
            if (_requestPathToParentCache.TryGetValue(requestPath, out var result))
            {
                return result;
            }

            result = requestPath.GetParent();
            _requestPathToParentCache.TryAdd(requestPath, result);

            return result;
        }

        private static RequestPath GetParent(this RequestPath requestPath)
        {
            // find a parent resource in the resource list
            // we are taking the resource with a path that is the child of this operationSet and taking the longest candidate
            // or null if none matched
            // NOTE that we are always using fuzzy match in the IsAncestorOf method, we need to block the ById operations - they literally can be anyone's ancestor when there is no better choice.
            // We will never want this
            var scope = requestPath.GetScopePath();
            var candidates = MgmtContext.Library.ResourceOperationSets.Select(operationSet => operationSet.GetRequestPath())
                .Concat(new List<RequestPath> { RequestPath.ResourceGroup, RequestPath.Subscription, RequestPath.ManagementGroup }) // When generating management group in management.json, the path is /providers/Microsoft.Management/managementGroups/{groupId} while RequestPath.ManagementGroup is /providers/Microsoft.Management/managementGroups/{managementGroupId}. We pick the first one.
                .Concat(Configuration.MgmtConfiguration.ParameterizedScopes)
                .Where(r => r.IsAncestorOf(requestPath)).OrderByDescending(r => r.Count);
            if (candidates.Any())
            {
                var parent = candidates.First();
                if (parent == RequestPath.Tenant)
                {
                    // when generating for tenant and a scope path like policy assignment in Azure.ResourceManager, Tenant could be the only parent in context.Library.ResourceOperationSets.
                    // we need to return the parameterized scope instead.
                    if (scope != requestPath && scope.IsParameterizedScope())
                        parent = scope;
                }
                return parent;
            }
            // the only option left is the tenant. But we have our last chance that its parent could be the scope of this
            // if the scope of this request path is parameterized, we return the scope as its parent
            if (scope != requestPath && scope.IsParameterizedScope())
                return scope;
            // we do not have much choice to make, return tenant as the parent
            return RequestPath.Tenant;
        }
    }
}
