// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Diagnostics;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Mgmt.Decorator;
using AutoRest.CSharp.Mgmt.Output;
using AutoRest.CSharp.Mgmt.Output.Models;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Requests;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Output.Models.Types;
using AutoRest.CSharp.Utilities;
using Azure.Core;
using Azure.ResourceManager;
using Operation = AutoRest.CSharp.Input.Operation;

namespace AutoRest.CSharp.Mgmt.Models
{
    /// <summary>
    /// A <see cref="MgmtRestOperation"/> includes some invocation information of a <see cref="RestClientMethod"/>
    /// We have the <see cref="RestClientMethod"/> that will be invoked, also we have the "Contextual Path" of this method,
    /// which records the context of this method invocation,
    /// providing you the information that which part of the `Id` we should pass to the parameter of <see cref="RestClientMethod"/>
    /// </summary>
    internal record MgmtRestOperation
    {
        private static readonly string[] NULLABLE_RESPONSE_METHOD_NAMES = { "GetIfExists" };

        private bool? _isLongRunning;

        /// <summary>
        /// The underlying <see cref="Operation"/> object.
        /// </summary>
        public Operation Operation { get; }

        public string OperationId => Operation.OperationId!;
        /// <summary>
        /// The name of this operation
        /// </summary>
        public string Name { get; }

        private string? _description;
        public string? Description => _description ??= Method.Description;
        public IEnumerable<Parameter> Parameters => Method.Parameters;

        public OperationSource? OperationSource { get; }

        public LongRunningInterimOperation? InterimOperation { get; }

        private Func<bool, FormattableString>? _returnsDescription;
        public Func<bool, FormattableString>? ReturnsDescription => IsPagingOperation ? _returnsDescription ??= EnsureReturnsDescription() : null;

        public PagingMethodWrapper? PagingMethod { get; }

        private CSharpType? _mgmtReturnType;
        public CSharpType? MgmtReturnType => _mgmtReturnType ??= GetMgmtReturnType(OriginalReturnType);

        public CSharpType? ListItemType => IsPagingOperation ? MgmtReturnType : null;

        private CSharpType? _wrappedMgmtReturnType;
        public CSharpType ReturnType => _wrappedMgmtReturnType ??= GetWrappedMgmtReturnType(MgmtReturnType);

        public MethodSignatureModifiers Accessibility => Method.Accessibility;
        public bool IsPagingOperation => Operation.Language.Default.Paging != null || IsListOperation;

        private string? _propertyBagName;

        private IEnumerable<Parameter>? _propertyBagSelectedParams;

        private Parameter? _propertyBagParameter;

        private bool IsListOperation => PagingMethod != null;

        public CSharpType? OriginalReturnType { get; }

        /// <summary>
        /// The actual operation
        /// </summary>
        public RestClientMethod Method { get; }
        /// <summary>
        /// The request path of this operation
        /// </summary>
        public RequestPath RequestPath { get; }
        /// <summary>
        /// The contextual path of this operation
        /// </summary>
        public RequestPath ContextualPath { get; }
        /// <summary>
        /// From which RestClient is this operation invoked
        /// </summary>
        public MgmtRestClient RestClient { get; }

        public Resource? Resource { get; }

        public bool ThrowIfNull { get; }

        public bool IsLongRunningOperation => _isLongRunning.HasValue ? _isLongRunning.Value : Operation.IsLongRunning;

        public bool IsFakeLongRunningOperation => IsLongRunningOperation && !Operation.IsLongRunning;

        public Parameter[] OverrideParameters { get; } = Array.Empty<Parameter>();

        public OperationFinalStateVia? FinalStateVia { get; }

        public Schema? FinalResponseSchema => Operation.IsLongRunning ? Operation.LongRunningFinalResponse.ResponseSchema : null;

        public MgmtRestOperation(Operation operation, RequestPath requestPath, RequestPath contextualPath, string methodName, bool? isLongRunning = null, bool throwIfNull = false, string? propertyBagName = null)
        {
            var method = MgmtContext.Library.GetRestClientMethod(operation);
            var restClient = MgmtContext.Library.GetRestClient(operation);

            _propertyBagName = propertyBagName;
            _isLongRunning = isLongRunning;
            ThrowIfNull = throwIfNull;
            Operation = operation;
            Method = method;
            PagingMethod = GetPagingMethodWrapper(method);
            RestClient = restClient;
            RequestPath = requestPath;
            ContextualPath = contextualPath;
            Name = methodName;
            Resource = GetResourceMatch(restClient, method, requestPath);
            FinalStateVia = operation.IsLongRunning ? operation.LongRunningFinalStateVia : null;
            OriginalReturnType = operation.IsLongRunning ? GetFinalResponse() : Method.ReturnType;
            OperationSource = GetOperationSource();
            InterimOperation = GetInterimOperation();
        }

        public MgmtRestOperation(MgmtRestOperation other, string nameOverride, CSharpType? overrideReturnType, string overrideDescription, params Parameter[] overrideParameters)
            : this(other, nameOverride, overrideReturnType, overrideDescription, other.ContextualPath, overrideParameters)
        {
        }

        public MgmtRestOperation(MgmtRestOperation other, string nameOverride, CSharpType? overrideReturnType, string overrideDescription, RequestPath contextualPath, params Parameter[] overrideParameters)
        {
            //copy values from other method
            _propertyBagName = other._propertyBagName;
            _isLongRunning = other.IsLongRunningOperation;
            ThrowIfNull = other.ThrowIfNull;
            Operation = other.Operation;
            Method = other.Method;
            PagingMethod = other.PagingMethod;
            RestClient = other.RestClient;
            RequestPath = other.RequestPath;
            ContextualPath = contextualPath;
            Resource = other.Resource;
            FinalStateVia = other.FinalStateVia;
            OriginalReturnType = other.OriginalReturnType;
            OperationSource = other.OperationSource;
            InterimOperation = other.InterimOperation;

            //modify some of the values
            Name = nameOverride;
            _mgmtReturnType = overrideReturnType;
            _description = overrideDescription;
            OverrideParameters = overrideParameters;
        }

        private OperationSource? GetOperationSource()
        {
            if (!IsLongRunningOperation)
                return null;

            if (MgmtReturnType is null)
                return null;

            if (IsFakeLongRunningOperation)
                return null;

            if (!MgmtContext.Library.CSharpTypeToOperationSource.TryGetValue(MgmtReturnType, out var operationSource))
            {
                var resourceBeingReturned = MgmtReturnType is { IsFrameworkType: false, Implementation: Resource resource } ? resource : null;
                operationSource = new OperationSource(MgmtReturnType, resourceBeingReturned, FinalResponseSchema!);
                MgmtContext.Library.CSharpTypeToOperationSource.Add(MgmtReturnType, operationSource);
            }
            return operationSource;
        }

        private LongRunningInterimOperation? GetInterimOperation()
        {
            if (!IsLongRunningOperation || IsFakeLongRunningOperation)
                return null;

            if (Operation.IsInterimLongRunningStateEnabled)
            {
                IEnumerable<Schema?> allSchemas = Operation.Responses.Select(r => r.ResponseSchema);
                ImmutableHashSet<Schema?> schemas = allSchemas.ToImmutableHashSet();
                if (MgmtReturnType is null || allSchemas.Count() != Operation.Responses.Count() || schemas.Count() != 1)
                    throw new NotSupportedException($"The interim state feature is only supported when all responses of the long running operation {Name} have the same shcema.");

                var interimOperation = new LongRunningInterimOperation(MgmtReturnType, Resource, Name);
                MgmtContext.Library.InterimOperations.Add(interimOperation);
                return interimOperation;
            }
            return null;
        }

        private CSharpType? GetFinalResponse()
        {
            var finalSchema = Operation.LongRunningFinalResponse.ResponseSchema;
            if (finalSchema is null)
                return null;

            try
            {
                return finalSchema.Type == AllSchemaTypes.Object ? MgmtContext.Library.FindTypeForSchema(finalSchema) : MgmtContext.TypeFactory.CreateType(finalSchema, false);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Final response for {RestClient.OperationGroup.Key}.{Method.Name} was not found it was of type {finalSchema.Name}", ex);
            }
        }

        /// <summary>
        /// This method returns a value converter statement in <see cref="FormattableString"/> from the underlying rest operation return type, to the desired <paramref name="mgmtReturnType"/>
        /// Note: MgmtReturnType always refers to the type that is not wrapped by Response, LRO or Pageable.
        /// </summary>
        /// <param name="clientVariable"></param>
        /// <param name="valueVariable"></param>
        /// <param name="mgmtReturnType"></param>
        /// <returns></returns>
        public FormattableString? GetValueConverter(FormattableString clientVariable, FormattableString valueVariable, CSharpType? mgmtReturnType)
        {
            var restReturnType = IsPagingOperation ? PagingMethod!.ItemType : Method.ReturnType;
            // when the method returns nothing, when this happens, the methodReturnType should either be Response, or ArmOperation
            if (restReturnType == null && mgmtReturnType == null)
                return null;

            Debug.Assert(restReturnType != null);
            Debug.Assert(mgmtReturnType != null);

            // check if this operation need a response converter
            if (mgmtReturnType.Equals(restReturnType))
                return null;

            if (InterimOperation != null)
                return null;

            var isRestReturnTypeResourceData = restReturnType is { IsFrameworkType: false, Implementation: ResourceData };

            // second check: if the method is returning a Resource and the rest operation is returning a ResourceData
            if (isRestReturnTypeResourceData && mgmtReturnType is { IsFrameworkType: false, Implementation: Resource returnResource })
            {
                // in this case we should call the constructor of the resource to wrap it into a resource
                return GetValueConverter(returnResource, clientVariable, valueVariable);
            }

            // otherwise we return null
            return null;
        }

        public FormattableString? GetValueConverter(FormattableString clientVariable, FormattableString valueVariable) => GetValueConverter(clientVariable, valueVariable, MgmtReturnType);

        private FormattableString GetValueConverter(Resource resource, FormattableString clientVariable, FormattableString valueVariable) => $"new {resource.Type}({clientVariable}, {valueVariable})";

        internal enum ResourceMatchType
        {
            Exact,
            ParentList, // list of myself from my direct owner - ex. VirtualMachine list on resource group
            AncestorList, // list of myself from my grand parent (or higher) - ex. VirtualMachine list on subscription
            ChildList, // list something else on myself - ex. List skus on VirtualMachine (usually listing non-resource) GET
            Context, // actions or behavior on myself - ex. Start on VirtualMachine POST
            CheckName,
            None
        }

        private Resource? GetResourceMatch(MgmtRestClient restClient, RestClientMethod method, RequestPath requestPath)
        {
            if (restClient.Resources.Count == 1)
                return restClient.Resources[0];

            Dictionary<ResourceMatchType, HashSet<Resource>> matches = new Dictionary<ResourceMatchType, HashSet<Resource>>();
            foreach (var resource in restClient.Resources)
            {
                var match = GetMatchType(Operation.GetHttpMethod(), resource.RequestPath, requestPath, method.IsListMethod(out var _));
                if (match == ResourceMatchType.None)
                    continue;
                if (match == ResourceMatchType.Exact)
                    return resource;
                if (!matches.TryGetValue(match, out var result))
                {
                    result = new HashSet<Resource>();
                    matches.Add(match, result);
                }
                result.Add(resource);
            }

            FormattableString errorText = (FormattableString)$"{restClient.Type.Name}.{method.Name}";
            foreach (ResourceMatchType? matchType in Enum.GetValues(typeof(ResourceMatchType)))
            {
                var resource = GetMatch(matchType!.Value, matches, errorText);

                if (resource is not null)
                    return resource;
            }
            return null;
        }

        private Resource? GetMatch(ResourceMatchType matchType, Dictionary<ResourceMatchType, HashSet<Resource>> matches, FormattableString error)
        {
            if (!matches.TryGetValue(matchType, out var matchTypeMatches))
                return null;

            var first = matchTypeMatches.First();
            if (matchTypeMatches.Count == 1)
                return first;

            // if we have multiple candidates, and the match is CheckName, we could return null because this check name could check name availibility of multiple resources
            if (matchType == ResourceMatchType.CheckName)
                return null;

            var parent = first.GetParents().First();
            if (parent is not null && AllMatchesSameParent(matchTypeMatches, parent, out bool areAllSingleton) && areAllSingleton)
                return parent as Resource;

            //this throw catches anything we do not expect if it ever fires it means our logic is either incomplete or we need a directive to adjust the request paths
            throw new InvalidOperationException($"Found more than 1 candidate for {error}, results were ({string.Join(',', matchTypeMatches.Select(r => r.Type.Name))})");
        }

        private bool AllMatchesSameParent(HashSet<Resource> matches, MgmtTypeProvider parent, out bool areAllSingleton)
        {
            areAllSingleton = true;
            foreach (var resource in matches)
            {
                areAllSingleton &= resource.IsSingleton;
                var current = resource.GetParents().FirstOrDefault();
                if (current is null)
                    return false;
                if (!current.Equals(parent))
                    return false;
            }
            return true;
        }

        /// <summary>
        /// This method returns true if the first scope <paramref name="operationScope"/> could cover the second scope <paramref name="resourceScope"/>
        /// AKA operationScope >= resourceScope
        /// For instance, if operationScope = subscription, resourceScope = resourceGroup, this should return true
        /// if operationScope = resourceGroup, resourceGroup = subscription, this should return false
        /// if operationScope = managementGroup, resourceGroup = subscription, this should return false
        /// </summary>
        /// <param name="resourceScope"></param>
        /// <param name="operationScope"></param>
        /// <returns></returns>
        private static bool DoesScopeCover(RequestPath operationScope, RequestPath resourceScope, RequestPath operationPath, RequestPath resourcePath)
        {
            if (operationScope.Equals(resourceScope))
                return true;
            // bigger scope should be shorter
            if (operationScope.IsAncestorOf(resourceScope))
                return true;

            // if resource has a parameterized scope, operation does not, we need to check if the scope type of the operation is included by the scope of resource
            if (resourceScope.IsParameterizedScope() && !operationScope.IsParameterizedScope())
            {
                var resourceScopeTypes = resourceScope.GetParameterizedScopeResourceTypes();
                if (resourceScopeTypes is null)
                    return false;
                var operationScopeType = operationScope.GetResourceType();
                if (resourceScopeTypes.Contains(ResourceTypeSegment.Any) || resourceScopeTypes.Contains(operationScopeType))
                    return true;
            }
            return false;
        }

        private static void SeparateScope(RequestPath original, out RequestPath scope, out RequestPath trimmed)
        {
            if (original.IndexOfLastProviders >= 0)
            {
                scope = original.GetScopePath();
                trimmed = original.TrimScope();
            }
            else
            {
                scope = RequestPath.Empty;
                trimmed = original;
            }
        }

        private static bool TryGetListMatch(HttpMethod method, RequestPath resourcePath, RequestPath operationPath, bool isList, out ResourceMatchType matchType)
        {
            matchType = ResourceMatchType.None;
            if (!isList)
                return false;
            if (method != HttpMethod.Get)
                return false;
            var operationLastSegment = operationPath.Last();
            if (!operationLastSegment.IsConstant)
                return false;
            SeparateScope(resourcePath, out var resourceScopePath, out var trimmedResourcePath);
            SeparateScope(operationPath, out var operationScopePath, out var trimmedOperationPath);

            if (trimmedResourcePath.Count > 0 && trimmedOperationPath.Equals(RequestPath.FromSegments(trimmedResourcePath.SkipLast(1))) && DoesScopeCover(operationScopePath, resourceScopePath, operationPath, resourcePath))
            {
                matchType = (resourceScopePath.IsParameterizedScope(), operationScopePath.IsParameterizedScope()) switch
                {
                    // if they are neither scope, we just check if the scope is the same. If it is the same, it is parent list, otherwise it is ancestor list.
                    (false, false) => resourceScopePath.GetResourceType() == operationScopePath.GetResourceType() ? ResourceMatchType.ParentList : ResourceMatchType.AncestorList,
                    // if resource has a scope, and the operation does not, and since we are here, the scope of resource covers the scope of the operation, this should always be a parent list (it should be a branch in the parent list operation
                    (true, false) => ResourceMatchType.ParentList,
                    _ => ResourceMatchType.AncestorList,
                };
                return true;
            }

            return false;
        }

        internal static ResourceMatchType GetMatchType(HttpMethod httpMethod, RequestPath resourcePath, RequestPath requestPath, bool isList)
        {
            //check exact match
            if (resourcePath == requestPath)
                return ResourceMatchType.Exact;

            var requestLastSegment = requestPath.Last();
            //check for a list by a parent or an ancestor
            if (TryGetListMatch(httpMethod, resourcePath, requestPath, isList, out var listMatch))
                return listMatch;

            //check for single value methods after the GET path which are typically POST methods
            if (resourcePath.Count == requestPath.Count - 1 && requestLastSegment.IsConstant && AreEqualBackToProvider(resourcePath, requestPath, 0, 1))
                return isList ? ResourceMatchType.ChildList : ResourceMatchType.Context;

            if (httpMethod == HttpMethod.Get)
                return ResourceMatchType.None;

            var resourceLastSegement = resourcePath.Last();
            //sometimes for singletons the POST methods show up at the same level
            if (resourcePath.Count == requestPath.Count && requestLastSegment.IsConstant && resourceLastSegement.IsConstant && AreEqualBackToProvider(resourcePath, requestPath, 1, 1))
                return ResourceMatchType.Context;

            //catch check name availability where the provider ending matches
            //this one catches a lot so we are narrowing it down to containing "name" dont know all the checknameavailability name types
            if (requestLastSegment.IsConstant &&
                RequestPath.Subscription.IsAncestorOf(requestPath) &&
                requestLastSegment.ToString().Contains("name", StringComparison.OrdinalIgnoreCase) &&
                AreEqualBackToProvider(resourcePath, requestPath, 2, 1))
                return ResourceMatchType.CheckName;

            return ResourceMatchType.None;
        }

        internal Parameter GetPropertyBagParameter(IEnumerable<Parameter> parameters)
        {
            // considering this method might be invoked several times in the future
            // we use _propertyBagParameter to cache the last result
            // and return it directly if the input parameter is the same as the previous one
            if (_propertyBagSelectedParams != null && _propertyBagSelectedParams.SequenceEqual(parameters))
            {
                return _propertyBagParameter!;
            }
            else
            {
                _propertyBagSelectedParams = parameters;
            }
            var clientName = _propertyBagName == null ?
                MgmtContext.Context.DefaultNamespace.Equals(typeof(ArmClient).Namespace) ? "Arm" : $"{MgmtContext.Context.DefaultNamespace.Split('.').Last()}Extensions" : _propertyBagName;

            var propertyBagName = $"{clientName}{Name}";
            if (Configuration.MgmtConfiguration.RenamePropertyBag.TryGetValue(OperationId, out string? modelName))
            {
                if (modelName.EndsWith("Options"))
                {
                    propertyBagName = modelName.ReplaceLast("Options", string.Empty);
                }
                else
                {
                    throw new InvalidOperationException($"The property bag model name for {OperationId} should end with Options.");
                }
            }
            var propertyBag = ((MgmtPropertyBag)Method.PropertyBag!).WithUpdatedInfo(propertyBagName, parameters);
            var schemaObject = propertyBag.PackModel;
            var existingModels = MgmtContext.Library.PropertyBagModels.Where(m => m.Type.Name == schemaObject.Type.Name);
            if (existingModels != null)
            {
                // sometimes we might have two or more property bag models with same name but different properties
                // we will throw exception in this case to prompt the user to rename the property bag model
                if (IsDuplicatedPropertyBag(existingModels, (ModelTypeProvider)schemaObject))
                {
                    throw new InvalidOperationException($"Another property bag model named {schemaObject.Type.Name} already exists, please use configuration `rename-property-bag` to rename the property bag model corresponding to the operation {OperationId}.");
                }
            }
            MgmtContext.Library.PropertyBagModels.Add(schemaObject);
            return _propertyBagParameter = propertyBag.PackParameter;
        }

        private static bool IsDuplicatedPropertyBag(IEnumerable<TypeProvider> existingModels, ModelTypeProvider modelToAdd)
        {
            foreach (var model in existingModels)
            {
                if (model is not ModelTypeProvider mgmtModel)
                    continue;
                if (mgmtModel.Properties.Count() != modelToAdd.Properties.Count())
                    return true;
                for (int i = 0; i < mgmtModel.Properties.Count(); i++)
                {
                    if (mgmtModel.Properties[i].Declaration.Name != modelToAdd.Properties[i].Declaration.Name)
                        return true;
                }
            }
            return false;
        }

        private static bool AreEqualBackToProvider(RequestPath resourcePath, RequestPath requestPath, int resourceSkips, int requestSkips)
        {
            int resourceStart = resourcePath.Count - 1 - resourceSkips;
            int requestStart = requestPath.Count - 1 - requestSkips;
            //resourcePath will have an extra reference segment for the resource name.  Skip this and walk back to the providers or beginning of array and everything must match to that point
            for (int resourceIndex = resourceStart, requestIndex = requestStart; resourceIndex >= 0 && requestIndex >= 0; resourceIndex--, requestIndex--)
            {
                if (resourcePath[resourceIndex].IsReference && resourcePath[resourceIndex].Equals(requestPath[requestIndex], false))
                    continue; //there are sometimes name differences in the path variable used but the rest of the context is the same

                if (resourcePath[resourceIndex] != requestPath[requestIndex])
                    return false;

                if (resourcePath[resourceIndex] == Segment.Providers)
                    return true;
            }
            return true;
        }

        private static bool AreEqualUpToProvider(RequestPath resourcePath, RequestPath requestPath)
        {
            for (int i = 0; i < Math.Min(resourcePath.Count, requestPath.Count); i++)
            {
                if (resourcePath[i] == Segment.Providers)
                    return true;

                if (resourcePath[i] != requestPath[i])
                    return false;
            }
            return true;
        }

        private CSharpType GetWrappedMgmtReturnType(CSharpType? originalType)
        {
            if (originalType is null)
                return IsLongRunningOperation ? typeof(ArmOperation) : Configuration.ApiTypes.ResponseType;

            if (IsPagingOperation)
                return originalType;

            if (InterimOperation is not null)
                return InterimOperation.InterimType;

            return IsLongRunningOperation ? originalType.WrapOperation(false) : originalType.WrapResponse(isAsync: false, isNullable: NULLABLE_RESPONSE_METHOD_NAMES.Contains(this.Name));
        }

        private CSharpType? GetMgmtReturnType(CSharpType? originalType)
        {
            //try for list method
            originalType = PagingMethod?.ItemType ?? originalType;

            if (originalType == null || originalType is not { IsFrameworkType: false, Implementation: ResourceData data })
                return originalType;

            if (Resource is not null && Resource.ResourceData.Type.Equals(originalType))
                return Resource.Type;

            var foundResources = MgmtContext.Library.FindResources(data).ToList();
            return foundResources.Count switch
            {
                0 => throw new InvalidOperationException($"No resource corresponding to {originalType?.Name} is found"),
                1 => foundResources.Single().Type,
                _ => originalType // we have multiple resource matched, we can only return the original type without wrapping it
            };
        }

        private static PagingMethodWrapper? GetPagingMethodWrapper(RestClientMethod method)
        {
            if (MgmtContext.Library.PagingMethods.TryGetValue(method, out var pagingMethod))
                return new PagingMethodWrapper(pagingMethod);

            if (method.IsListMethod(out var itemType, out var valuePropertyName))
                return new PagingMethodWrapper(method, itemType, valuePropertyName);

            return null;
        }

        private Func<bool, FormattableString> EnsureReturnsDescription()
            => (isAsync) => $"{(isAsync ? "An async" : "A")} collection of {ListItemType!:C} that may take multiple service requests to iterate over.";
    }
}
