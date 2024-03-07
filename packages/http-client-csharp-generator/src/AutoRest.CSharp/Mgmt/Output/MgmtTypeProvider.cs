// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.AutoRest;
using AutoRest.CSharp.Mgmt.Decorator;
using AutoRest.CSharp.Mgmt.Models;
using AutoRest.CSharp.Mgmt.Output.Models;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Output.Models.Types;
using AutoRest.CSharp.Utilities;
using Azure.Core;
using Azure.ResourceManager;
using Humanizer.Localisation;
using static AutoRest.CSharp.Output.Models.MethodSignatureModifiers;

namespace AutoRest.CSharp.Mgmt.Output
{
    /// <summary>
    /// MgmtTypeProvider represents the information that corresponds to the generated class in the SDK that contains operations in it.
    /// This includes <see cref="Resource"/>, <see cref="ResourceCollection"/>, <see cref="ArmClientExtension"/>, <see cref="MgmtExtension"/>, <see cref="MgmtMockableExtension"/> and <see cref="MgmtExtensionWrapper"/>
    /// </summary>
    internal abstract class MgmtTypeProvider : TypeProvider
    {
        protected bool IsArmCore { get; }

        protected MgmtTypeProvider(string resourceName) : base(MgmtContext.Context)
        {
            ResourceName = resourceName;
            IsArmCore = Configuration.MgmtConfiguration.IsArmCore;
            IsStatic = !IsArmCore && BaseType is null;
            ArmClientProperty = new MemberExpression(null, "Client"); // this refers to ArmResource.Client which is protected internal therefore we have to hardcode in plain string here instead of using nameof
            IdProperty = new MemberExpression(null, nameof(ArmResource.Id));
            MethodModifiers = Public | Virtual;
        }

        protected ValueExpression ArmClientProperty { get; init; }

        protected ValueExpression IdProperty { get; init; }

        protected MethodSignatureModifiers MethodModifiers { get; init; }

        protected virtual FormattableString IdParamDescription => $"The identifier of the resource that is the target of operations.";
        public Parameter ResourceIdentifierParameter => new(Name: "id", Description: IdParamDescription, Type: typeof(ResourceIdentifier), DefaultValue: null, ValidationType.None, null);

        public string Accessibility => DefaultAccessibility;
        protected override string DefaultAccessibility => "public";

        public virtual bool CanValidateResourceType => true;

        /// <summary>
        /// If this is false, all the RestOperation instances will be initialized in the constructor
        /// If this is true, all the RestOperation instances will be initialized when the property is invoked for the first time
        /// </summary>
        public virtual bool IsInitializedByProperties => false;

        public virtual bool HasChildResourceGetMethods => true;

        public virtual FormattableString IdVariableName => $"Id";

        public virtual FormattableString BranchIdVariableName => $"Id";

        public string Namespace => DefaultNamespace;

        public virtual string DiagnosticNamespace => Namespace;

        public abstract CSharpType? BaseType { get; }

        protected internal virtual CSharpType TypeAsResource => Type;

        private IReadOnlyList<CSharpType>? _enumerableInterfaces;
        public IEnumerable<CSharpType> EnumerableInterfaces => _enumerableInterfaces ??= EnsureGetInterfaces();
        protected virtual IReadOnlyList<CSharpType> EnsureGetInterfaces()
        {
            return Array.Empty<CSharpType>();
        }

        public IEnumerable<CSharpType> GetImplements()
        {
            if (BaseType is not null)
                yield return BaseType;

            foreach (var type in EnumerableInterfaces)
            {
                yield return type;
            }
        }
        public virtual bool IsStatic { get; }

        public abstract FormattableString Description { get; }

        private HashSet<NameSetKey>? _uniqueSets;
        public HashSet<NameSetKey> UniqueSets => _uniqueSets ??= EnsureUniqueSets();

        public virtual Resource? DefaultResource { get; } = null;

        private IEnumerable<Parameter>? _extraConstructorParameters;
        public IEnumerable<Parameter> ExtraConstructorParameters => _extraConstructorParameters ??= EnsureExtraCtorParameters();
        protected virtual IEnumerable<Parameter> EnsureExtraCtorParameters() => new List<Parameter>();

        protected virtual FieldModifiers FieldModifiers { get; } = FieldModifiers.Private;

        private IEnumerable<FieldDeclaration>? _fields;
        public IEnumerable<FieldDeclaration> Fields => _fields ??= EnsureFieldDeclaration();
        protected virtual IEnumerable<FieldDeclaration> EnsureFieldDeclaration()
        {
            foreach (var set in UniqueSets)
            {
                var nameSet = GetRestDiagNames(set);
                yield return new FieldDeclaration(
                    FieldModifiers,
                    Configuration.ApiTypes.ClientDiagnosticsType,
                    nameSet.DiagnosticField);
                yield return new FieldDeclaration(
                    FieldModifiers,
                    set.RestClient.Type,
                    nameSet.RestField);
            }

            var additionalFields = GetAdditionalFields();
            foreach (var field in additionalFields)
            {
                yield return field;
            }
        }

        protected virtual IEnumerable<FieldDeclaration> GetAdditionalFields() => Enumerable.Empty<FieldDeclaration>();

        private ConstructorSignature? _mockingCtor;
        public ConstructorSignature? MockingCtor => _mockingCtor ??= EnsureMockingCtor();
        protected virtual ConstructorSignature? EnsureMockingCtor()
        {
            return new ConstructorSignature(
                Type,
                null,
                Description: $"Initializes a new instance of the {Type:C} class for mocking.",
                Modifiers: Protected,
                Parameters: Array.Empty<Parameter>());
        }

        private ConstructorSignature? _armClientCtor;
        public ConstructorSignature? ArmClientCtor => _armClientCtor ??= EnsureArmClientCtor();
        protected virtual ConstructorSignature? EnsureArmClientCtor() => null;
        private ConstructorSignature? _resourceDataCtor;
        public ConstructorSignature? ResourceDataCtor => _resourceDataCtor ??= EnsureResourceDataCtor();
        protected virtual ConstructorSignature? EnsureResourceDataCtor() => null;

        private Dictionary<NameSetKey, NameSet> _nameCache = new Dictionary<NameSetKey, NameSet>();
        public NameSet GetRestDiagNames(NameSetKey set)
        {
            if (_nameCache.TryGetValue(set, out NameSet names))
                return names;

            var resource = set.Resource;
            var client = set.RestClient;
            string? resourceName = resource is not null ? resource.ResourceName : client.Resources.Contains(DefaultResource) ? DefaultResource?.ResourceName : null;

            string uniqueName = GetUniqueName(resourceName, client.OperationGroup.Key);

            string uniqueVariable = uniqueName.ToVariableName();
            var result = new NameSet(
                $"_{uniqueVariable}ClientDiagnostics",
                $"{uniqueName}ClientDiagnostics",
                $"_{uniqueVariable}RestClient",
                $"{uniqueName}RestClient",
                $"{uniqueVariable}ApiVersion");
            _nameCache.Add(set, result);

            return result;
        }

        private string GetUniqueName(string? resourceName, string clientName)
        {
            if (resourceName is not null)
            {
                if (string.IsNullOrEmpty(clientName))
                {
                    return resourceName;
                }
                else
                {
                    var singularClientName = clientName.ToSingular(true);
                    return resourceName.Equals(singularClientName, StringComparison.Ordinal)
                        ? resourceName
                        : $"{resourceName}{clientName}";
                }
            }
            else
            {
                return string.IsNullOrEmpty(clientName) ? "Default" : clientName;
            }
        }

        /// <summary>
        /// This is the display name for this TypeProvider.
        /// If this TypeProvider generates an extension class, this will be the resource name of whatever it extends from.
        /// </summary>
        public string ResourceName { get; }

        private IEnumerable<MgmtClientOperation>? _clientOperations;
        /// <summary>
        /// The collection of operations that will be included in this generated class.
        /// </summary>
        public IEnumerable<MgmtClientOperation> ClientOperations => _clientOperations ??= EnsureClientOperations();
        protected abstract IEnumerable<MgmtClientOperation> EnsureClientOperations();

        private IEnumerable<MgmtClientOperation>? _allOperations;
        public IEnumerable<MgmtClientOperation> AllOperations => _allOperations ??= EnsureAllOperations();
        protected virtual IEnumerable<MgmtClientOperation> EnsureAllOperations() => ClientOperations;

        public virtual ResourceTypeSegment GetBranchResourceType(RequestPath branch)
        {
            throw new InvalidOperationException($"Tried to get a branch resource type from a type provider that doesn't support in {GetType().Name}.");
        }

        private IEnumerable<Resource>? _childResources;
        /// <summary>
        /// The collection of <see cref="Resource"/> that is a child of this generated class.
        /// </summary>
        public virtual IEnumerable<Resource> ChildResources => _childResources ??= MgmtContext.Library.ArmResources.Where(resource => resource.GetParents().Contains(this));

        protected string GetOperationName(Operation operation, string clientResourceName)
        {
            // search the configuration for a override of this operation
            if (operation.TryGetConfigOperationName(out var name))
                return name;

            return CalculateOperationName(operation, clientResourceName);
        }

        /// <summary>
        /// If the operationGroup of this operation is the same as the resource operation group, we just use operation.CSharpName()
        /// If it is not, we append the operation group key after operation.CSharpName() to make sure this operation has an unique name.
        /// </summary>
        /// <param name="operation"></param>
        /// <param name="clientResourceName">For extension classes, use the ResourceName. For resources, use its operation group name</param>
        /// <returns></returns>
        protected virtual string CalculateOperationName(Operation operation, string clientResourceName)
        {
            // search the configuration for a override of this operation
            if (operation.TryGetConfigOperationName(out var name))
                return name;

            var operationGroup = MgmtContext.Library.GetRestClient(operation).OperationGroup;
            var ogKey = operationGroup.Key;
            var singularOGKey = ogKey.LastWordToSingular();
            if (ogKey == clientResourceName || singularOGKey == clientResourceName)
            {
                return operation.MgmtCSharpName(false);
            }

            var resourceName = string.Empty;
            if (MgmtContext.Library.GetRestClientMethod(operation).IsListMethod(out _))
            {
                resourceName = ogKey.IsNullOrEmpty() ? string.Empty : singularOGKey.ResourceNameToPlural();
                var opName = operation.MgmtCSharpName(!resourceName.IsNullOrEmpty());
                // Remove 'By[Resource]' if the method is put in the [Resource] class. For instance, GetByDatabaseDatabaseColumns now becomes GetDatabaseColumns under Database resource class.
                if (opName.EndsWith($"By{clientResourceName.LastWordToSingular()}"))
                {
                    opName = opName.Substring(0, opName.IndexOf($"By{clientResourceName.LastWordToSingular()}"));
                }
                // For other variants, move By[Resource] to the end. For instance, GetByInstanceServerTrustGroups becomes GetServerTrustGroupsByInstance.
                else if (opName.StartsWith("GetBy") && opName.SplitByCamelCase().ToList()[1] == "By")
                {
                    return $"Get{resourceName}{opName.Substring(opName.IndexOf("By"))}";
                }
                return $"{opName}{resourceName}";
            }
            resourceName = ogKey.IsNullOrEmpty() ? string.Empty : singularOGKey;
            return $"{operation.MgmtCSharpName(!resourceName.IsNullOrEmpty())}{resourceName}";
        }

        private HashSet<NameSetKey> EnsureUniqueSets()
        {
            HashSet<NameSetKey> uniqueSets = new HashSet<NameSetKey>();
            foreach (var operation in AllOperations)
            {
                Resource? resource = operation.Resource;
                if (resource is null && operation.RestClient.Resources.Contains(DefaultResource))
                    resource = DefaultResource;

                NameSetKey key = new NameSetKey(operation.RestClient, resource);
                if (uniqueSets.Contains(key))
                    continue;
                uniqueSets.Add(key);
            }
            return uniqueSets;
        }

        private IEnumerable<Method>? _childResourceEntryMethods;
        public IEnumerable<Method> ChildResourceEntryMethods => _childResourceEntryMethods ??= BuildChildResourceEntries();

        protected virtual IEnumerable<Method> BuildChildResourceEntries()
        {
            foreach (var resource in ChildResources)
            {
                if (resource.IsSingleton)
                    yield return BuildGetSingletonResourceMethod(resource);
                else if (resource.ResourceCollection is { } collection)
                {
                    var getCollectionMethod = BuildGetChildCollectionMethod(collection);
                    yield return getCollectionMethod;

                    if (HasChildResourceGetMethods)
                    {
                        yield return BuildGetChildResourceMethod(collection, getCollectionMethod.Signature, true);
                        yield return BuildGetChildResourceMethod(collection, getCollectionMethod.Signature, false);
                    }
                }
            }
        }

        protected FormattableString BuildDescriptionForSingletonResource(Resource resource)
            => $"Gets an object representing a {resource.Type.Name} along with the instance operations that can be performed on it in the {ResourceName}.";

        protected virtual Method BuildGetSingletonResourceMethod(Resource resource)
        {
            var signature = new MethodSignature(
                        $"Get{resource.ResourceName}",
                        null,
                        BuildDescriptionForSingletonResource(resource),
                        MethodModifiers,
                        resource.Type,
                        $"Returns a {resource.Type:C} object.",
                        Array.Empty<Parameter>());
            var methodBody = Snippets.Return(
                Snippets.New.Instance(
                    resource.Type,
                    ArmClientProperty,
                    resource.SingletonResourceIdSuffix!.BuildResourceIdentifier(IdProperty)));
            return new(signature, methodBody);
        }

        protected FormattableString BuildDescriptionForChildCollection(ResourceCollection collection)
            => $"Gets a collection of {collection.Resource.Type.Name.LastWordToPlural()} in the {ResourceName}.";

        protected virtual Method BuildGetChildCollectionMethod(ResourceCollection collection)
        {
            var resource = collection.Resource;
            var signature = new MethodSignature(
                $"Get{resource.ResourceName.ResourceNameToPlural()}",
                null,
                BuildDescriptionForChildCollection(collection),
                MethodModifiers,
                collection.Type,
                $"An object representing collection of {resource.Type.Name.LastWordToPlural()} and their operations over a {resource.Type.Name}.",
                collection.ExtraConstructorParameters.ToArray());
            var methodBody = BuildGetResourceCollectionMethodBody(collection);
            return new(signature, methodBody);
        }
        private MethodBodyStatement BuildGetResourceCollectionMethodBody(ResourceCollection collection)
        {
            // when there are extra ctor parameters, we cannot use the GetCachedClient method to cache the collection instance
            if (collection.ExtraConstructorParameters.Any())
            {
                var parameters = new List<ValueExpression>
                {
                    ArmClientProperty,
                    IdProperty
                };
                parameters.AddRange(collection.ExtraConstructorParameters.Select(p => (ValueExpression)p));
                return Snippets.Return(
                    Snippets.New.Instance(
                        collection.Type,
                        parameters.ToArray()));
            }
            else
            {
                var clientArgument = new VariableReference(typeof(ArmClient), "client");
                return Snippets.Return(
                    new InvokeInstanceMethodExpression(
                        null,
                        nameof(ArmResource.GetCachedClient),
                        new[] {
                            new FuncExpression(new[] { clientArgument.Declaration }, Snippets.New.Instance(collection.Type, clientArgument, IdProperty))
                        },
                        null,
                        false));
            }
        }

        protected FormattableString BuildDescriptionForChildResource(ResourceCollection collection)
            => collection.GetOperation.Description;

        protected virtual Method BuildGetChildResourceMethod(ResourceCollection collection, MethodSignatureBase getCollectionMethodSignature, bool isAsync)
        {
            var getOperation = collection.GetOperation;
            // construct the method signature
            var signature = getOperation.MethodSignature with
            {
                // name after `Get{ResourceName}`
                Name = $"Get{collection.Resource.ResourceName}",
                Description = BuildDescriptionForChildResource(collection),
                Modifiers = MethodModifiers,
                // the parameter of this method should be the parameters on the collection's ctor + parameters on the Get method
                // also the validations of parameters will be skipped
                Parameters = getCollectionMethodSignature.Parameters.Concat(getOperation.MethodSignature.Parameters).ToArray(),
                Attributes = getOperation.MethodSignature.Attributes.Append(new CSharpAttribute(typeof(ForwardsClientCallsAttribute))).ToList()
            };

            var callGetCollection = new InvokeInstanceMethodExpression(
                    null,
                    getCollectionMethodSignature.Name,
                    getCollectionMethodSignature.Parameters.Select(p => (ValueExpression)p).ToArray(),
                    null,
                    getCollectionMethodSignature.Modifiers.HasFlag(Async));
            var callGetOperation = callGetCollection.Invoke(getOperation.MethodSignature.WithAsync(isAsync));
            var methodBody = Snippets.Return(callGetOperation);

            return new(signature.WithAsync(isAsync), methodBody);
        }
    }
}
