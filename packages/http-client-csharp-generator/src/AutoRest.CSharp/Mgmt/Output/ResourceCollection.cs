// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Mgmt.Decorator;
using AutoRest.CSharp.Mgmt.Models;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Requests;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Utilities;
using Azure.ResourceManager;
using static AutoRest.CSharp.Mgmt.Decorator.ParameterMappingBuilder;
using static AutoRest.CSharp.Output.Models.MethodSignatureModifiers;

namespace AutoRest.CSharp.Mgmt.Output
{
    internal class ResourceCollection : Resource
    {
        private const string _suffixValue = "Collection";

        public ResourceCollection(OperationSet operationSet, IEnumerable<Operation> operations, Resource resource)
            : base(operationSet, operations, resource.ResourceName, resource.ResourceType, resource.ResourceData, CollectionPosition)
        {
            Resource = resource;
        }

        public override CSharpType? BaseType => typeof(ArmCollection);
        protected override IReadOnlyList<CSharpType> EnsureGetInterfaces()
        {
            if (GetAllOperation is null || GetAllOperation.MethodParameters.Any(p => !p.IsOptionalInSignature &&
            (!p.IsPropertyBag || p.Validation != ValidationType.None)))
                return base.EnsureGetInterfaces();

            var getRestOperation = GetAllOperation.OperationMappings.Values.First();
            return new CSharpType[]
            {
                new CSharpType(typeof(IEnumerable<>), getRestOperation.MgmtReturnType!),
                new CSharpType(typeof(IAsyncEnumerable<>), getRestOperation.MgmtReturnType!)
            };
        }
        public Resource Resource { get; }

        public override Resource GetResource() => Resource;

        public override bool CanValidateResourceType => ResourceTypes.SelectMany(p => p.Value).Distinct().Count() == 1;

        public override FormattableString BranchIdVariableName => $"Id";

        private MgmtClientOperation? _getAllOperation;
        public MgmtClientOperation? GetAllOperation => _getAllOperation ??= EnsureGetAllOperation();

        private Dictionary<Parameter, FormattableString> _extraConstructorParameters = new();

        protected override IEnumerable<Parameter> EnsureExtraCtorParameters()
        {
            _ = ExtraContextualParameterMapping;
            return _extraConstructorParameters.Keys;
        }

        protected override ConstructorSignature? EnsureArmClientCtor()
        {
            return new ConstructorSignature(
              Type,
              null,
              Description: $"Initializes a new instance of the {Type:C} class.",
              Modifiers: Internal,
              Parameters: _armClientCtorParameters.Concat(ExtraConstructorParameters).ToArray(),
              Initializer: new(
                  isBase: true,
                  arguments: _armClientCtorParameters));
        }
        protected override ConstructorSignature? EnsureResourceDataCtor() => null;

        protected override IEnumerable<ContextualParameterMapping> EnsureExtraContextualParameterMapping()
        {
            var result = new List<ContextualParameterMapping>();
            Operation? op = null;
            foreach (var operation in _clientOperations)
            {
                if (IsListOperation(operation, OperationSet))
                {
                    op = operation;
                    break;
                }
            }

            if (op is null)
                return result;

            RestClientMethod method = MgmtContext.Library.GetRestClientMethod(op);
            // calculate the ResourceType from the RequestPath of this resource
            var resourceTypeSegments = ResourceType.Select((segment, index) => (segment, index)).Where(tuple => tuple.segment.IsReference).ToList();
            // iterate over all the reference segments in the diff of this GetAll operation
            var candidatesOfParameters = new List<Parameter>(method.Parameters);

            var opRequestPath = op.GetRequestPath(ResourceType);
            foreach (var segment in GetDiffFromRequestPath(opRequestPath, GetContextualPath(OperationSet, opRequestPath)))
            {
                var index = resourceTypeSegments.FindIndex(tuple => tuple.segment == segment);
                if (index < 0)
                {
                    var parameter = candidatesOfParameters.First(p => p.Name == segment.ReferenceName && p.Type.Equals(segment.Type));
                    candidatesOfParameters.Remove(parameter);
                    // this reference is not in the resource type, therefore this parameter goes to the constructor
                    _extraConstructorParameters.Add(parameter, $"_{segment.ReferenceName}");
                    // there is a key for this parameter, get the key and add this one to contextual parameter mapping
                    var key = ParameterMappingBuilder.FindKeyOfParameter(parameter, opRequestPath);
                    result.Add(new ContextualParameterMapping(key, segment, GetFieldName(parameter)));
                }
                else
                {
                    var candidate = resourceTypeSegments[index];
                    var value = ResourceType[candidate.index];
                    try
                    {
                        result.Add(new ContextualParameterMapping("", segment, $"\"{value.ConstantValue}\""));
                    }
                    catch (InvalidOperationException)
                    {
                        throw new InvalidOperationException($"Expected enum type for the parameter '{segment.ReferenceName}' in method '{method.Operation.Path}'");
                    }
                }
            }
            return result;
        }

        private MgmtClientOperation? EnsureGetAllOperation()
        {
            // if this resource was listed in list-exception section, we suppress the exception here
            // or if the debug flag `--mgmt-debug.suppress-list-exception` is on, we suppress the exception here
            var suppressListException = Configuration.MgmtConfiguration.ListException.Contains(RequestPath)
                || Configuration.MgmtConfiguration.MgmtDebug.SuppressListException;
            var getAllOperation = ClientOperations.Where(operation => operation.Name == "GetAll").OrderBy(operation => ReferenceSegments(operation).Count()).FirstOrDefault();
            if (!suppressListException && getAllOperation == null)
                throw new ErrorHelpers.ErrorException($"The ResourceCollection {Type.Name} (RequestPath: {RequestPath}) does not have a `GetAll` method");

            if (getAllOperation == null)
                return getAllOperation;

            // skip the following transformations for `ById` resources.
            // In ById resources, the required parameters of the GetAll operation is usually a scope, doing the following transform will require the constructor to accept a scope variable
            // which is not reasonable and causes problems
            if (IsById)
            {
                return ReferenceSegments(getAllOperation).Any() ? null : getAllOperation;
            }

            return getAllOperation;
        }

        public FormattableString GetFieldName(Parameter parameter)
        {
            return _extraConstructorParameters[parameter];
        }

        private static IEnumerable<Segment> ReferenceSegments(MgmtClientOperation clientOperation)
        {
            var operation = clientOperation.First();
            return GetDiffFromRequestPath(operation.RequestPath, operation.ContextualPath);
        }

        private static IEnumerable<Segment> GetDiffFromRequestPath(RequestPath requestPath, RequestPath contextPath)
        {
            RequestPath diff;
            if (requestPath.IsAncestorOf(contextPath))
            {
                diff = requestPath.TrimAncestorFrom(contextPath);
            }
            else
            {
                diff = contextPath.TrimAncestorFrom(requestPath);
            }
            return diff.Where(segment => segment.IsReference);
        }

        protected override bool ShouldIncludeOperation(Operation operation)
        {
            if (Configuration.MgmtConfiguration.OperationPositions.TryGetValue(operation.OperationId!, out var positions))
            {
                return positions.Contains(Position);
            }
            // if the position of this operation is not set in the configuration, we just include those are excluded in the resource class
            return !base.ShouldIncludeOperation(operation);
        }

        /// <summary>
        /// This method returns the contextual path from one resource <see cref="OperationSet"/>
        /// In the <see cref="ResourceCollection"/> class, we need to use the parent RequestPath of the OperationSet as its contextual path
        /// </summary>
        /// <param name="operationSet"></param>
        /// <param name="operationRequestPath"></param>
        /// <returns></returns>
        protected override RequestPath GetContextualPath(OperationSet operationSet, RequestPath operationRequestPath)
        {
            var contextualPath = operationSet.ParentRequestPath(ResourceType);
            // we need to replace the scope in this contextual path with the actual scope in the operation
            var scope = contextualPath.GetScopePath();
            if (!scope.IsParameterizedScope())
                return contextualPath;

            return operationRequestPath.GetScopePath().Append(contextualPath.TrimScope());
        }

        // name after `{ResourceName}Collection`
        protected override string DefaultName => ResourceName + _suffixValue;

        protected override FormattableString CreateDescription()
        {
            var an = ResourceName.StartsWithVowel() ? "an" : "a";
            List<FormattableString> lines = new List<FormattableString>();
            var parents = Resource.GetParents();
            var parentTypes = parents.Select(parent => parent.TypeAsResource).ToList();
            var parentDescription = CreateParentDescription(parentTypes);

            lines.Add($"A class representing a collection of {Resource.Type:C} and their operations.");
            // only append the following information when the parent of me is not myself, aka TenantResource
            if (parentDescription != null && !parents.Contains(Resource))
            {
                lines.Add($"Each {Resource.Type:C} in the collection will belong to the same instance of {parentDescription}.");
                lines.Add($"To get {an} {Type:C} instance call the Get{ResourceName.LastWordToPlural()} method from an instance of {parentDescription}.");
            }

            return FormattableStringHelpers.Join(lines, "\r\n");
        }

        protected override IEnumerable<MgmtClientOperation> EnsureAllOperations()
        {
            var result = new List<MgmtClientOperation>();
            if (CreateOperation != null)
                result.Add(CreateOperation);
            if (GetOperation != null)
                result.Add(GetOperation);
            result.AddRange(ClientOperations);
            if (GetOperation != null)
            {
                var getMgmtRestOperation = GetOperation.OperationMappings.Values.First();
                result.Add(MgmtClientOperation.FromOperation(
                    new MgmtRestOperation(
                        getMgmtRestOperation,
                        "Exists",
                        typeof(bool),
                        $"Checks to see if the resource exists in azure."),
                    IdVariableName));
                result.Add(MgmtClientOperation.FromOperation(
                    new MgmtRestOperation(
                        getMgmtRestOperation,
                        "GetIfExists",
                        getMgmtRestOperation.MgmtReturnType,
                        $"Tries to get details for this resource from the service."),
                    IdVariableName));
            }

            return result;
        }

        public override ResourceTypeSegment GetBranchResourceType(RequestPath branch)
        {
            return branch.GetResourceType();
        }

        protected override IEnumerable<FieldDeclaration> GetAdditionalFields()
        {
            foreach (var reference in ExtraConstructorParameters)
            {
                yield return new FieldDeclaration(FieldModifiers, reference.Type, GetFieldName(reference).ToString());
            }
        }

        private IDictionary<RequestPath, ISet<ResourceTypeSegment>>? _resourceTypes;
        public IDictionary<RequestPath, ISet<ResourceTypeSegment>> ResourceTypes => _resourceTypes ??= EnsureResourceTypes();

        private IDictionary<RequestPath, ISet<ResourceTypeSegment>> EnsureResourceTypes()
        {
            var result = new Dictionary<RequestPath, ISet<ResourceTypeSegment>>();
            foreach (var operation in AllOperations.SelectMany(o => o))
            {
                var resourceTypes = GetResourceTypes(operation.RequestPath, operation.ContextualPath);
                if (result.TryGetValue(operation.ContextualPath, out var set))
                {
                    set.UnionWith(resourceTypes);
                }
                else
                {
                    set = new HashSet<ResourceTypeSegment>();
                    set.UnionWith(resourceTypes);
                    result.Add(operation.ContextualPath, set);
                }
            }
            return result;
        }

        private IEnumerable<ResourceTypeSegment> GetResourceTypes(RequestPath requestPath, RequestPath contextualPath)
        {
            var type = contextualPath.GetResourceType();
            if (type == ResourceTypeSegment.Scope)
                return requestPath.GetParameterizedScopeResourceTypes()!;

            return type.AsIEnumerable();
        }

        public Parameter ParentParameter => ResourceParameter with
        {
            Name = "parent",
            Description = $"The resource representing the parent resource."
        };

        protected override FormattableString IdParamDescription => $"The identifier of the parent resource that is the target of operations.";
    }
}
