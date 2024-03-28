// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Mgmt.Decorator;
using AutoRest.CSharp.Mgmt.Models;
using AutoRest.CSharp.Mgmt.Report;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Requests;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Output.Models.Types;
using Azure.Core;
using Azure.ResourceManager;
using static AutoRest.CSharp.Common.Output.Models.Snippets;
using static AutoRest.CSharp.Mgmt.Decorator.ParameterMappingBuilder;
using static AutoRest.CSharp.Output.Models.MethodSignatureModifiers;

namespace AutoRest.CSharp.Mgmt.Output
{
    internal class Resource : MgmtTypeProvider
    {
        protected static readonly string ResourcePosition = "resource";
        protected static readonly string CollectionPosition = "collection";
        private const string DataFieldName = "_data";
        protected readonly Parameter[] _armClientCtorParameters;

        private static readonly HttpMethod[] MethodToExclude = new[] { HttpMethod.Put, HttpMethod.Get, HttpMethod.Delete, HttpMethod.Patch };

        private static readonly Parameter TagKeyParameter = new Parameter(
            "key",
            $"The key for the tag.",
            typeof(string),
            null,
            ValidationType.AssertNotNull,
            null);

        private static readonly Parameter TagValueParameter = new Parameter(
            "value",
            $"The value for the tag.",
            typeof(string),
            null,
            ValidationType.AssertNotNull,
            null);

        private static readonly Parameter TagSetParameter = new Parameter(
            "tags",
            $"The set of tags to use as replacement.",
            typeof(IDictionary<string, string>),
            null,
            ValidationType.AssertNotNull,
            null);

        /// <summary>
        /// The position means which class an operation should go. Possible value of this property is `resource` or `collection`.
        /// There is a configuration in <see cref="MgmtConfiguration"/> which assign values to operations.
        /// </summary>
        protected string Position { get; }

        public OperationSet OperationSet { get; }

        protected IEnumerable<Operation> _clientOperations;

        private RequestPath? _requestPath;
        public RequestPath RequestPath => _requestPath ??= OperationSet.GetRequestPath(ResourceType);

        /// <summary>
        /// </summary>
        /// <param name="operations">The map that contains all possible operations in this resource and its corresponding resource collection class (if any)</param>
        /// <param name="resourceName">The name of the corresponding resource data model</param>
        /// <param name="resourceType">The type of this resource instance represents</param>
        /// <param name="resourceData">The corresponding resource data model</param>
        /// <param name="context">The build context of this resource instance</param>
        /// <param name="position">The position of operations of this class. <see cref="Position"/> for more information</param>
        protected internal Resource(OperationSet operationSet, IEnumerable<Operation> operations, string resourceName, ResourceTypeSegment resourceType, ResourceData resourceData, string position)
            : base(resourceName)
        {
            _armClientCtorParameters = new[] { KnownParameters.ArmClient, ResourceIdentifierParameter };
            OperationSet = operationSet;
            ResourceType = resourceType;
            ResourceData = resourceData;

            if (OperationSet.TryGetSingletonResourceSuffix(out var singletonResourceIdSuffix))
                SingletonResourceIdSuffix = singletonResourceIdSuffix;

            _clientOperations = GetClientOperations(operationSet, operations);

            IsById = OperationSet.IsById;
            Position = position;
        }

        protected override ConstructorSignature? EnsureArmClientCtor()
        {
            return new ConstructorSignature(
              Type,
              null,
              Description: $"Initializes a new instance of the {Type:C} class.",
              Modifiers: Internal,
              Parameters: _armClientCtorParameters,
              Initializer: new(
                  isBase: true,
                  arguments: _armClientCtorParameters));
        }

        protected override ConstructorSignature? EnsureResourceDataCtor()
        {
            return new ConstructorSignature(
                Type,
                null,
                Description: $"Initializes a new instance of the {Type:C} class.",
                Modifiers: Internal,
                Parameters: new[] { KnownParameters.ArmClient, ResourceDataParameter },
                Initializer: new(
                    IsBase: false,
                    Arguments: new ValueExpression[] { KnownParameters.ArmClient, ResourceDataIdExpression(ResourceDataParameter) }));
        }

        public override CSharpType? BaseType => typeof(ArmResource);

        public override Resource? DefaultResource => this;

        protected override FieldModifiers FieldModifiers => base.FieldModifiers | FieldModifiers.ReadOnly;

        protected override IEnumerable<FieldDeclaration> GetAdditionalFields()
        {
            // the resource data private field
            yield return new FieldDeclaration(FieldModifiers, ResourceData.Type, DataFieldName);

            // the resource type public field
            yield return new FieldDeclaration(
                $"Gets the resource type for the operations",
                FieldModifiers.Public | FieldModifiers.Static | FieldModifiers.ReadOnly,
                typeof(ResourceType),
                "ResourceType",
                Literal(ResourceType.ToString()));
        }

        private IReadOnlyList<PropertyDeclaration>? _properties;
        public IReadOnlyList<PropertyDeclaration> Properties => _properties ??= BuildProperties().ToArray();

        protected virtual IEnumerable<PropertyDeclaration> BuildProperties()
        {
            // HasData property
            var hasDataProperty = new PropertyDeclaration(
                description: $"Gets whether or not the current instance has data.",
                modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual,
                propertyType: typeof(bool),
                name: "HasData",
                propertyBody: new AutoPropertyBody(false));

            yield return hasDataProperty;

            var dataProperty = new PropertyDeclaration(
                description: $"Gets the data representing this Feature.",
                modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual,
                propertyType: ResourceData.Type,
                name: "Data",
                propertyBody: new MethodPropertyBody(new MethodBodyStatement[]
                {
                    new IfStatement(Not(new BoolExpression(new VariableReference(hasDataProperty.PropertyType, hasDataProperty.Declaration))), AddBraces: false)
                    {
                        Throw(Snippets.New.Instance(typeof(InvalidOperationException), Literal("The current instance does not have data, you must call Get first.")))
                    },
                    Return(new MemberExpression(null, DataFieldName))
                }),
                exceptions: new Dictionary<CSharpType, FormattableString>()
                {
                    [typeof(InvalidOperationException)] = $"Throws if there is no data loaded in the current instance."
                });

            yield return dataProperty;
        }

        public Resource(OperationSet operationSet, IEnumerable<Operation> operations, string resourceName, ResourceTypeSegment resourceType, ResourceData resourceData)
            : this(operationSet, operations, resourceName, resourceType, resourceData, ResourcePosition)
        { }

        private static IEnumerable<Operation> GetClientOperations(OperationSet operationSet, IEnumerable<Operation> operations)
            => operations.Concat(operationSet.Where(operation => !MethodToExclude.Contains(operation.GetHttpMethod())));

        protected bool IsById { get; }

        protected MgmtClientOperation? GetOperationWithVerb(HttpMethod method, string operationName, bool? isLongRunning = null, bool throwIfNull = false)
        {
            var result = new List<MgmtRestOperation>();
            var operation = OperationSet.GetOperation(method);
            if (operation is not null)
            {
                var requestPath = operation.GetRequestPath(ResourceType);
                var contextualPath = GetContextualPath(OperationSet, requestPath);
                var restOperation = new MgmtRestOperation(
                    operation,
                    requestPath,
                    contextualPath,
                    operationName,
                    isLongRunning,
                    throwIfNull,
                    Type.Name);
                result.Add(restOperation);
            }

            return MgmtClientOperation.FromOperations(result, IdVariableName);
        }

        public virtual Resource GetResource() => this;

        private bool loggedForDefaultName = false;
        // name after `{ResourceName}Resource`, unless the `ResourceName` already ends with `Resource`
        protected override string DefaultName
        {
            get
            {
                if (Configuration.MgmtConfiguration.NoResourceSuffix.Contains(ResourceName))
                {
                    if (!loggedForDefaultName)
                    {
                        MgmtReport.Instance.TransformSection.AddTransformLog(new TransformItem(TransformTypeName.NoResourceSuffix, ResourceName), ResourceName, $"NoResourceSuffix for {ResourceName}");
                        loggedForDefaultName = true;
                    }
                    return ResourceName;
                }
                else
                    return ResourceName.AddResourceSuffixToResourceName();
            }
        }

        public override FormattableString Description => CreateDescription();

        public bool IsSingleton => SingletonResourceIdSuffix != null;

        public SingletonResourceSuffix? SingletonResourceIdSuffix { get; }

        private bool? _isTaggable;
        public bool IsTaggable => GetIsTaggable();

        private bool GetIsTaggable()
        {
            if (_isTaggable is not null)
                return _isTaggable.Value;

            var bodyParameter = GetBodyParameter();
            if (ResourceData.IsTaggable && bodyParameter is not null)
            {
                var bodyParamType = bodyParameter.Type;
                _isTaggable = bodyParamType.Equals(ResourceData.Type) ? ResourceData.IsTaggable : DoesUpdateSchemaHaveTags(bodyParamType);
            }
            else
            {
                _isTaggable = false;
            }

            return _isTaggable.Value;
        }

        private bool DoesUpdateSchemaHaveTags(CSharpType bodyParamType)
        {
            if (bodyParamType.IsFrameworkType)
                return false;
            if (bodyParamType.Implementation is null)
                return false;
            if (bodyParamType.Implementation is not SchemaObjectType schemaObject)
                return false;
            return schemaObject.ObjectSchema.HasTags();
        }

        private Parameter? GetBodyParameter()
        {
            //found a case in logic where there is a patch with only a cancellation token
            //I think this is a bug in there swagger but this works around that since generation
            //will fail if the update doesn't have a body param
            var op = UpdateOperation ?? CreateOperation;
            if (op is null)
                return null;

            return op.MethodParameters.FirstOrDefault(p => p.RequestLocation == Common.Input.RequestLocation.Body);
        }

        /// <summary>
        /// Finds the corresponding <see cref="ResourceCollection"/> of this <see cref="Resource"/>
        /// Return null when this resource is a singleton.
        /// </summary>
        public ResourceCollection? ResourceCollection { get; internal set; }

        /// <summary>
        /// Finds the corresponding <see cref="ResourceData"/> of this <see cref="Resource"/>
        /// </summary>
        public ResourceData ResourceData { get; }
        private MgmtClientOperation? _createOperation;
        private MgmtClientOperation? _getOperation;
        private MgmtClientOperation? _deleteOperation;
        private MgmtClientOperation? _updateOperation;
        public virtual MgmtClientOperation? CreateOperation => _createOperation ??= GetOperationWithVerb(HttpMethod.Put, "CreateOrUpdate", true);
        public virtual MgmtClientOperation GetOperation => _getOperation ??= GetOperationWithVerb(HttpMethod.Get, "Get", throwIfNull: true)!;
        public virtual MgmtClientOperation? DeleteOperation => _deleteOperation ??= GetOperationWithVerb(HttpMethod.Delete, "Delete", true);
        public virtual MgmtClientOperation? UpdateOperation => _updateOperation ??= EnsureUpdateOperation();

        private MgmtClientOperation? EnsureUpdateOperation()
        {
            var updateOperation = GetOperationWithVerb(HttpMethod.Patch, "Update");

            if (updateOperation != null)
                return updateOperation;

            if (ResourceCollection?.CreateOperation is not null)
            {
                var createOrUpdateOperation = ResourceCollection.CreateOperation.OperationMappings.Values.First();
                return MgmtClientOperation.FromOperation(
                    new MgmtRestOperation(
                        createOrUpdateOperation,
                        "Update",
                        createOrUpdateOperation.MgmtReturnType,
                        createOrUpdateOperation.Description ?? $"Update this {ResourceName}.",
                        createOrUpdateOperation.RequestPath),
                    IdVariableName);
            }

            return null;
        }

        protected virtual bool ShouldIncludeOperation(Operation operation)
        {
            if (Configuration.MgmtConfiguration.OperationPositions.TryGetValue(operation.OperationId!, out var positions))
            {
                return positions.Contains(Position);
            }
            // In the resource class, we need to exclude the List operations
            var restClientMethod = MgmtContext.Library.GetRestClientMethod(operation);
            if (restClientMethod.IsListMethod(out var valueType))
                return !valueType.EqualsByName(ResourceData.Type);
            return true;
        }

        protected override IEnumerable<MgmtClientOperation> EnsureAllOperations()
        {
            var result = new List<MgmtClientOperation>();
            if (GetOperation != null)
                result.Add(GetOperation);
            if (DeleteOperation != null)
                result.Add(DeleteOperation);
            if (UpdateOperation != null)
                result.Add(UpdateOperation);
            if (IsSingleton && CreateOperation != null)
                result.Add(CreateOperation);
            result.AddRange(ClientOperations);
            if (GetOperation != null && IsTaggable)
            {
                var getOperation = GetOperation.OperationMappings.Values.First();
                result.Add(MgmtClientOperation.FromOperation(
                    new MgmtRestOperation(
                        getOperation,
                        "AddTag",
                        getOperation.MgmtReturnType,
                        "Add a tag to the current resource.",
                        TagKeyParameter,
                        TagValueParameter),
                    IdVariableName,
                    isConvenientOperation: true));

                result.Add(MgmtClientOperation.FromOperation(
                    new MgmtRestOperation(
                        getOperation,
                        "SetTags",
                        getOperation.MgmtReturnType,
                        "Replace the tags on the resource with the given set.",
                        TagSetParameter),
                    IdVariableName,
                    isConvenientOperation: true));

                result.Add(MgmtClientOperation.FromOperation(
                    new MgmtRestOperation(
                        getOperation,
                        "RemoveTag",
                        getOperation.MgmtReturnType,
                        "Removes a tag by key from the resource.",
                        TagKeyParameter),
                    IdVariableName,
                    isConvenientOperation: true));
            }
            return result;
        }

        public override FormattableString BranchIdVariableName => $"Id.Parent";

        public override ResourceTypeSegment GetBranchResourceType(RequestPath branch)
        {
            return branch.ParentRequestPath().GetResourceType();
        }

        private IEnumerable<ContextualParameterMapping>? _extraContextualParameterMapping;
        public IEnumerable<ContextualParameterMapping> ExtraContextualParameterMapping => _extraContextualParameterMapping ??= EnsureExtraContextualParameterMapping();
        protected virtual IEnumerable<ContextualParameterMapping> EnsureExtraContextualParameterMapping() => Enumerable.Empty<ContextualParameterMapping>();

        /// <summary>
        /// A collection of ClientOperations.
        /// The List of <see cref="MgmtRestOperation"/> represents a set of the same operations under different parent (OperationSet)
        /// </summary>
        protected override IEnumerable<MgmtClientOperation> EnsureClientOperations() => EnsureClientOperationMap().Values;

        /// <summary>
        /// This is a map from the diff request path between the operation and the contextual path to the actual operations
        /// </summary>
        private IDictionary<string, MgmtClientOperation>? _clientOperationMap;
        private IDictionary<string, MgmtClientOperation> EnsureClientOperationMap()
        {
            if (_clientOperationMap != null)
                return _clientOperationMap;

            var result = new Dictionary<string, List<MgmtRestOperation>>();
            var resourceRequestPath = OperationSet.GetRequestPath();
            var resourceRestClient = OperationSet.Any() ? MgmtContext.Library.GetRestClient(OperationSet.First()) : null;
            // iterate over all the operations under this operationSet to get their diff between the corresponding contextual path
            foreach (var operation in _clientOperations)
            {
                if (!ShouldIncludeOperation(operation))
                    continue; // meaning this operation will be included in the collection
                var method = operation.GetHttpMethod();
                // we use the "unique" part of this operation's request path comparing with its containing resource's path as the key to categorize the operations
                var requestPath = operation.GetRequestPath(ResourceType);
                var key = $"{method}{resourceRequestPath.Minus(requestPath)}";
                var contextualPath = GetContextualPath(OperationSet, requestPath);
                var methodName = IsListOperation(operation, OperationSet) ?
                    "GetAll" :// hard-code the name of a resource collection operation to "GetAll"
                    GetOperationName(operation, resourceRestClient?.OperationGroup.Key ?? string.Empty);
                // get the MgmtRestOperation with a proper name
                var restOperation = new MgmtRestOperation(
                    operation,
                    requestPath,
                    contextualPath,
                    methodName,
                    propertyBagName: Type.Name);

                if (result.TryGetValue(key, out var list))
                {
                    list.Add(restOperation);
                }
                else
                {
                    result.Add(key, new List<MgmtRestOperation> { restOperation });
                }
            }

            // now the operations should be properly categarized into the dictionary in the key of diff between contextual request path and the operation
            // TODO -- what if the response type is not the same? Also we need to verify they have the same parameters before we could union those together
            _clientOperationMap = result.Where(pair => pair.Value.Count > 0).ToDictionary(
                pair => pair.Key,
                pair => MgmtClientOperation.FromOperations(pair.Value, IdVariableName)!); // We first filtered the ones with at least one operation, therefore this will never be null
            return _clientOperationMap;
        }

        /// <summary>
        /// This method returns the contextual path from one resource <see cref="Models.OperationSet"/>
        /// In the <see cref="Resource"/> class, we just use the RequestPath of the OperationSet as its contextual path
        /// Also we need to replace the parameterized scope if there is any with the actual scope value.
        /// </summary>
        /// <param name="operationSet"></param>
        /// <param name="operationRequestPath"></param>
        /// <returns></returns>
        protected virtual RequestPath GetContextualPath(OperationSet operationSet, RequestPath operationRequestPath)
        {
            var contextualPath = RequestPath;
            // we need to replace the scope in this contextual path with the actual scope in the operation
            var scope = contextualPath.GetScopePath();
            if (!scope.IsParameterizedScope())
                return contextualPath;

            return operationRequestPath.GetScopePath().Append(contextualPath.TrimScope());
        }

        protected bool IsListOperation(Operation operation, OperationSet operationSet)
        {
            return operation.IsResourceCollectionOperation(out var resourceOperationSet) && resourceOperationSet == operationSet;
        }

        public ResourceTypeSegment ResourceType { get; }

        protected virtual FormattableString CreateDescription()
        {
            var an = ResourceName.StartsWithVowel() ? "an" : "a";
            List<FormattableString> lines = new List<FormattableString>();
            var parents = this.GetParents();
            var parentTypes = parents.Select(parent => parent.TypeAsResource).ToList();
            var parentDescription = CreateParentDescription(parentTypes);

            lines.Add($"A Class representing {an} {ResourceName} along with the instance operations that can be performed on it.");
            lines.Add($"If you have a {typeof(ResourceIdentifier):C} you can construct {an} {Type:C}");
            lines.Add($"from an instance of {typeof(ArmClient):C} using the Get{DefaultName} method.");
            // only append the following information when the parent of me is not myself, aka TenantResource
            if (parentDescription != null && !parents.Contains(this))
            {
                lines.Add($"Otherwise you can get one from its parent resource {parentDescription} using the Get{ResourceName} method.");
            }

            return FormattableStringHelpers.Join(lines, "\r\n");
        }

        protected static FormattableString? CreateParentDescription(IReadOnlyList<CSharpType> parentTypes) => parentTypes.Count switch
        {
            0 => null,
            _ => FormattableStringHelpers.Join(parentTypes.Select(type => (FormattableString)$"{type:C}").ToList(), ", ", " or "),
        };

        private static CSharpType GetReferenceType(Reference reference)
            => reference.Name switch
            {
                "location" when reference.Type.EqualsIgnoreNullable(typeof(string)) => typeof(AzureLocation),
                _ => reference.Type
            };

        private Parameter CreateResourceIdentifierParameter(Segment segment)
            => new Parameter(segment.Reference.Name, $"The {segment.Reference.Name}", GetReferenceType(segment.Reference), null, ValidationType.None, null);

        public Method? _createResourceIdentifierMethod;
        public Method CreateResourceIdentifierMethod => _createResourceIdentifierMethod ??= BuildCreateResourceIdentifierMethod();

        protected virtual Method BuildCreateResourceIdentifierMethod()
        {
            var signature = new MethodSignature(
                Name: "CreateResourceIdentifier",
                null,
                Description: $"Generate the resource identifier of a {Type:C} instance.",
                Modifiers: Public | Static,
                ReturnType: typeof(ResourceIdentifier),
                ReturnDescription: null,
                Parameters: RequestPath.Where(segment => segment.IsReference).Select(CreateResourceIdentifierParameter).ToArray());

            // build the format string of the id
            var formatBuilder = new StringBuilder();
            var first = true;
            var refCount = 0;
            foreach (var segment in RequestPath)
            {
                if (first)
                {
                    first = false;
                    // If first segment is "{var}", then we should not add leading "/". Instead, we should let callers to specify, e.g. "{scope}/providers/Microsoft.Resources/..." v.s. "/subscriptions/{subscriptionId}/..."
                    if (RequestPath.Count == 0 || RequestPath[0].IsConstant)
                        formatBuilder.Append('/');
                }
                else
                    formatBuilder.Append('/');
                if (segment.IsConstant)
                    formatBuilder.Append(segment.ConstantValue);
                else
                {
                    formatBuilder.Append('{')
                        .Append(refCount)
                        .Append('}');
                    refCount++;
                }
            }

            var resourceId = new VariableReference(typeof(ResourceIdentifier), "resourceId");
            var methodBody = new MethodBodyStatement[]
            {
                Var(resourceId, new FormattableStringExpression(formatBuilder.ToString(), signature.Parameters.Select(p => (ValueExpression)p).ToArray())),
                Return(Snippets.New.Instance(typeof(ResourceIdentifier), resourceId))
            };
            return new Method(signature, methodBody);
        }

        public ValueExpression ResourceDataIdExpression(ValueExpression dataExpression)
        {
            var id = dataExpression.Property("Id");
            var typeOfId = ResourceData.TypeOfId;
            if (typeOfId != null && typeOfId.Equals(typeof(string)))
            {
                return Snippets.New.Instance(typeof(ResourceIdentifier), id);
            }
            else
            {
                // we have ensured other cases we would have an Id of Azure.Core.ResourceIdentifier type
                return id;
            }
        }

        public Parameter ResourceParameter => new(Name: "resource", Description: $"The client parameters to use in these operations.", Type: typeof(ArmResource), DefaultValue: null, ValidationType.None, null);
        public Parameter ResourceDataParameter => new(Name: "data", Description: $"The resource that is the target of operations.", Type: ResourceData.Type, DefaultValue: null, ValidationType.None, null);
    }
}
