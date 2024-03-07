// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Input.Examples;
using AutoRest.CSharp.Common.Output.Builders;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models.Responses;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.Output.Models.Requests;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Output.Models.Types;
using AutoRest.CSharp.Utilities;
using Microsoft.CodeAnalysis;
using static AutoRest.CSharp.Output.Models.MethodSignatureModifiers;

namespace AutoRest.CSharp.Output.Models
{
    internal class LowLevelClient : TypeProvider
    {
        private readonly string _libraryName;
        private readonly TypeFactory _typeFactory;
        private readonly IEnumerable<InputParameter> _clientParameters;
        private readonly IReadOnlyDictionary<string, InputClientExample> _clientParameterExamples;
        private readonly InputAuth _authorization;
        private readonly IEnumerable<InputOperation> _operations;

        protected override string DefaultName { get; }
        protected override string DefaultAccessibility => "public";

        private ConstructorSignature? _subClientInternalConstructor;

        public string Description { get; }
        public ConstructorSignature SubClientInternalConstructor => _subClientInternalConstructor ??= BuildSubClientInternalConstructor();

        public IReadOnlyList<LowLevelClient> SubClients { get; init; }
        public LowLevelClient? ParentClient;

        public ClientOptionsTypeProvider ClientOptions { get; }

        public bool IsSubClient { get; }

        private bool? _isResourceClient;
        public bool IsResourceClient => _isResourceClient ??= Parameters.Any(p => p.IsResourceIdentifier);

        private LowLevelClient? _topLevelClient;
        public LowLevelClient TopLevelClient => _topLevelClient ??= GetTopLevelClient(this);

        private LowLevelClient GetTopLevelClient(LowLevelClient client)
        {
            if (client.ParentClient is null)
                return client;

            return GetTopLevelClient(client.ParentClient);
        }

        public LowLevelClient(string name, string ns, string description, string libraryName, LowLevelClient? parentClient, IEnumerable<InputOperation> operations, IEnumerable<InputParameter> clientParameters, InputAuth authorization, SourceInputModel? sourceInputModel, ClientOptionsTypeProvider clientOptions, IReadOnlyDictionary<string, InputClientExample> examples, TypeFactory typeFactory)
            : base(ns, sourceInputModel)
        {
            _libraryName = libraryName;
            _typeFactory = typeFactory;
            DefaultName = name;
            Description = description;
            IsSubClient = parentClient != null;
            ParentClient = parentClient;

            ClientOptions = clientOptions;

            _clientParameters = clientParameters;
            _clientParameterExamples = examples;
            _authorization = authorization;
            _operations = operations;

            SubClients = Array.Empty<LowLevelClient>();
        }

        private IReadOnlyList<Parameter>? _parameters;
        public IReadOnlyList<Parameter> Parameters => _parameters ??= new RestClientBuilder(_clientParameters, _typeFactory).GetOrderedParametersByRequired();

        private ClientFields? _fields;
        public ClientFields Fields => _fields ??= ClientFields.CreateForClient(Parameters, _authorization);

        private (ConstructorSignature[] PrimaryConstructors, ConstructorSignature[] SecondaryConstructors)? _constructors;
        private (ConstructorSignature[] PrimaryConstructors, ConstructorSignature[] SecondaryConstructors) Constructors => _constructors ??= BuildPublicConstructors(Parameters);
        public ConstructorSignature[] PrimaryConstructors => Constructors.PrimaryConstructors;
        public ConstructorSignature[] SecondaryConstructors => Constructors.SecondaryConstructors;

        private IReadOnlyList<LowLevelClientMethod>? _allClientMethods;
        private IReadOnlyList<LowLevelClientMethod> AllClientMethods => _allClientMethods ??= BuildMethods(this, _typeFactory, _operations, Fields, Declaration.Namespace, Declaration.Name, _sourceInputModel).ToArray();

        private IReadOnlyList<LowLevelClientMethod>? _clientMethods;
        public IReadOnlyList<LowLevelClientMethod> ClientMethods => _clientMethods ??= AllClientMethods
                .OrderBy(m => m.LongRunning != null ? 2 : m.PagingInfo != null ? 1 : 0) // Temporary sorting to minimize amount of changed files. Will be removed when new LRO is implemented
                .ToArray();

        private IReadOnlyList<RestClientMethod>? _requestMethods;
        public IReadOnlyList<RestClientMethod> RequestMethods => _requestMethods ??= AllClientMethods.Select(m => m.RequestMethod)
                .Concat(ClientMethods.Select(m => m.PagingInfo?.NextPageMethod).WhereNotNull())
                .Distinct()
                .ToArray();

        private IReadOnlyList<ResponseClassifierType>? _responseClassifierTypes;
        public IReadOnlyList<ResponseClassifierType> ResponseClassifierTypes => _responseClassifierTypes ??= RequestMethods.Select(m => m.ResponseClassifierType).ToArray();

        private LowLevelSubClientFactoryMethod? _factoryMethod;
        public LowLevelSubClientFactoryMethod? FactoryMethod => _factoryMethod ??= ParentClient != null ? BuildFactoryMethod(ParentClient.Fields, _libraryName) : null;

        public IEnumerable<LowLevelClientMethod> CustomMethods()
        {
            //TODO: get all custom methods using similar method to GetEffectiveCtor
            yield break;
        }


        public static IEnumerable<LowLevelClientMethod> BuildMethods(LowLevelClient? client, TypeFactory typeFactory, IEnumerable<InputOperation> operations, ClientFields fields, string namespaceName, string clientName, SourceInputModel? sourceInputModel)
        {
            var builders = operations.ToDictionary(o => o, o => new OperationMethodChainBuilder(client, o, namespaceName, clientName, fields, typeFactory, sourceInputModel, client?._clientParameterExamples));
            foreach (var (_, builder) in builders)
            {
                builder.BuildNextPageMethod(builders);
            }

            foreach (var (_, builder) in builders)
            {
                yield return builder.BuildOperationMethodChain();
            }
        }

        private (ConstructorSignature[] PrimaryConstructors, ConstructorSignature[] SecondaryConstructors) BuildPublicConstructors(IReadOnlyList<Parameter> orderedParameters)
        {
            if (!IsSubClient)
            {
                var requiredParameters = RestClientBuilder.GetRequiredParameters(orderedParameters).ToArray();
                var optionalParameters = GetOptionalParametersInConstructor(RestClientBuilder.GetOptionalParameters(orderedParameters).Append(CreateOptionsParameter())).ToArray();

                return (
                    BuildPrimaryConstructors(requiredParameters, optionalParameters).ToArray(),
                    BuildSecondaryConstructors(requiredParameters, optionalParameters).ToArray()
                );
            }
            else
            {
                return (Array.Empty<ConstructorSignature>(), new[] { CreateMockingConstructor() });
            }
        }

        private IEnumerable<Parameter> GetOptionalParametersInConstructor(IEnumerable<Parameter> optionalParameters)
        {
            return optionalParameters.Where(
                p => ClientOptions.Type.EqualsIgnoreNullable(p.Type) || p.IsEndpoint); // Endpoint is an exception, even it is optional, still need to be the parameter of constructor
        }

        public IEnumerable<Parameter> GetOptionalParametersInOptions()
        {
            return RestClientBuilder.GetOptionalParameters(Parameters).Where(p => !p.IsEndpoint);
        }

        private IEnumerable<ConstructorSignature> BuildPrimaryConstructors(IReadOnlyList<Parameter> requiredParameters, IReadOnlyList<Parameter> optionalParameters)
        {
            var optionalToRequired = optionalParameters
                .Select(parameter => ClientOptions.Type.EqualsIgnoreNullable(parameter.Type)
                ? parameter with { DefaultValue = null, Validation = ValidationType.None }
                : parameter with
                {
                    DefaultValue = null,
                    Validation = parameter.Initializer != null ? Parameter.GetValidation(parameter.Type, parameter.RequestLocation, parameter.SkipUrlEncoding) : parameter.Validation,
                    Initializer = null
                }).ToArray();

            if (Fields.CredentialFields.Count == 0)
            {
                /* order the constructor paramters as (endpoint, requiredParameters, OptionalParamters).
                 * use the OrderBy to put endpoint as the first parameter.
                 * */
                yield return CreatePrimaryConstructor(requiredParameters.Concat(optionalToRequired).OrderBy(parameter => !parameter.Name.Equals("endpoint", StringComparison.OrdinalIgnoreCase)).ToArray());
            }
            else
            {
                foreach (var credentialField in Fields.CredentialFields)
                {
                    /* order the constructor paramters as (endpoint, requiredParameters, CredentialParamter, OptionalParamters).
                     * use the OrderBy to put endpoint as the first parameter.
                     * */
                    yield return CreatePrimaryConstructor(requiredParameters.Append(CreateCredentialParameter(credentialField!.Type)).Concat(optionalToRequired).OrderBy(parameter => !parameter.Name.Equals("endpoint", StringComparison.OrdinalIgnoreCase)).ToArray());
                }
            }
        }

        private IEnumerable<ConstructorSignature> BuildSecondaryConstructors(IReadOnlyList<Parameter> requiredParameters, IReadOnlyList<Parameter> optionalParameters)
        {
            if (requiredParameters.Any() || Fields.CredentialFields.Any())
            {
                yield return CreateMockingConstructor();
            }

            /* Construct the parameter arguments to call primitive constructor.
             * In primitive constructor, the endpoint is the first parameter,
             * so put the endpoint as the first parameter argument if the endpoint is optional paramter.
             * */
            var optionalParametersArguments = optionalParameters
                .Where(p => !p.Name.Equals("endpoint", StringComparison.OrdinalIgnoreCase))
                .Select(p => new FormattableStringToExpression(p.Initializer ?? p.Type.GetParameterInitializer(p.DefaultValue!.Value)!))
                .ToArray();
            var optionalEndpoint = optionalParameters.Where(p => p.Name.Equals("endpoint", StringComparison.OrdinalIgnoreCase)).FirstOrDefault();
            var arguments = new List<ValueExpression>();
            if (optionalEndpoint != null)
            {
                arguments.Add(new FormattableStringToExpression(optionalEndpoint.Initializer ?? optionalEndpoint.Type.GetParameterInitializer(optionalEndpoint.DefaultValue!.Value)!));
            }

            arguments.AddRange(requiredParameters.Select(p => (ValueExpression)p));

            if (Fields.CredentialFields.Count == 0)
            {
                var allArguments = arguments.Concat(optionalParametersArguments);
                yield return CreateSecondaryConstructor(requiredParameters, allArguments.ToArray());
            }
            else
            {
                foreach (var credentialField in Fields.CredentialFields)
                {
                    var credentialParameter = CreateCredentialParameter(credentialField!.Type);
                    var allArguments = arguments.Append(credentialParameter).Concat(optionalParametersArguments);
                    yield return CreateSecondaryConstructor(requiredParameters.Append(credentialParameter).ToArray(), allArguments.ToArray());
                }
            }
        }

        private ConstructorSignature CreatePrimaryConstructor(IReadOnlyList<Parameter> parameters)
            => new(Type, $"Initializes a new instance of {Declaration.Name}", null, Public, parameters);

        private ConstructorSignature CreateSecondaryConstructor(IReadOnlyList<Parameter> parameters, IReadOnlyList<ValueExpression> arguments)
        {
            return new(Type, $"Initializes a new instance of {Declaration.Name}", null, Public, parameters, Initializer: new ConstructorInitializer(false, arguments));
        }

        private Parameter CreateCredentialParameter(CSharpType type)
        {
            return new Parameter(
                "credential",
                $"A credential used to authenticate to an Azure Service.",
                type,
                null,
                ValidationType.AssertNotNull,
                null);
        }

        private ConstructorSignature CreateMockingConstructor()
            => new(Type, $"Initializes a new instance of {Declaration.Name} for mocking.", null, Protected, Array.Empty<Parameter>());

        private Parameter CreateOptionsParameter()
        {
            var clientOptionsType = ClientOptions.Type.WithNullable(true);
            return new Parameter("options", $"The options for configuring the client.", clientOptionsType, Constant.Default(clientOptionsType), ValidationType.None, Constant.NewInstanceOf(clientOptionsType).GetConstantFormattable());
        }

        private ConstructorSignature BuildSubClientInternalConstructor()
        {
            var constructorParameters = GetSubClientFactoryMethodParameters()
                .Select(p => p with { DefaultValue = null, Validation = ValidationType.None, Initializer = null })
                .ToArray();

            return new ConstructorSignature(Type, $"Initializes a new instance of {Declaration.Name}", null, Internal, constructorParameters);
        }

        public LowLevelSubClientFactoryMethod BuildFactoryMethod(ClientFields parentFields, string libraryName)
        {
            var constructorCallParameters = GetSubClientFactoryMethodParameters().ToArray();
            var methodParameters = constructorCallParameters.Where(p => parentFields.GetFieldByParameter(p) == null).ToArray();

            var subClientName = Type.Name;
            var methodName = subClientName.StartsWith(libraryName)
                ? subClientName[libraryName.Length..]
                : subClientName;

            if (!IsResourceClient)
            {
                methodName += ClientBuilder.GetClientSuffix();
            }

            var methodSignature = new MethodSignature($"Get{methodName}",
                $"Initializes a new instance of {Type.Name}", null, Public | Virtual, Type, null,
                methodParameters.ToArray());
            FieldDeclaration? cachingField = methodParameters.Any()
                ? null
                : new FieldDeclaration(FieldModifiers.Private, this.Type, $"_cached{Type.Name}");

            return new LowLevelSubClientFactoryMethod(methodSignature, cachingField, constructorCallParameters);
        }

        private IEnumerable<Parameter> GetSubClientFactoryMethodParameters()
            => new[] { KnownParameters.ClientDiagnostics, KnownParameters.Pipeline, KnownParameters.KeyAuth, KnownParameters.TokenAuth }
                .Concat(RestClientBuilder.GetConstructorParameters(Parameters, null, includeAPIVersion: true).OrderBy(parameter => !parameter.Name.Equals("endpoint", StringComparison.OrdinalIgnoreCase)))
                .Where(p => Fields.GetFieldByParameter(p) != null);

        internal MethodSignatureBase? GetEffectiveCtor(bool includeClientOptions = false)
        {
            //TODO: This method is needed because we allow roslyn code gen attributes to be run AFTER the writers do their job but before
            //      the code is emitted. This is a hack to allow the writers to know what the effective ctor is after the roslyn code gen attributes
            var constructors = includeClientOptions ? PrimaryConstructors : SecondaryConstructors;

            List<ConstructorSignature> candidates = new(constructors.Where(c => c.Modifiers.HasFlag(Public)));

            if (ExistingType is not null)
            {
                //    [CodeGenSuppress("ConfidentialLedgerCertificateClient", typeof(Uri), typeof(TokenCredential), typeof(ConfidentialLedgerClientOptions))]
                //remove suppressed ctors from the candidates
                foreach (var attribute in ExistingType.GetAttributes().Where(a => a.AttributeClass is not null && a.AttributeClass.Name == "CodeGenSuppressAttribute"))
                {
                    if (attribute.ConstructorArguments.Length != 2)
                        continue;
                    var classTarget = attribute.ConstructorArguments[0].Value;
                    if (classTarget is null || !classTarget.Equals(DefaultName))
                        continue;

                    candidates.RemoveAll(ctor => IsParamMatch(ctor.Parameters, attribute.ConstructorArguments[1].Values.Select(tc => (INamedTypeSymbol)(tc.Value!)).ToArray()));
                }

                // add custom ctors into the candidates
                foreach (var existingCtor in ExistingType.Constructors)
                {
                    var parameters = existingCtor.Parameters;
                    var modifiers = GetModifiers(existingCtor);
                    bool isPublic = modifiers.HasFlag(Public);
                    //TODO: Currently skipping ctors which use models from the library due to constructing with all empty lists.
                    if (!isPublic || parameters.Length == 0 || parameters.Any(p => ((INamedTypeSymbol)p.Type).GetCSharpType(_typeFactory) == null))
                    {
                        if (!isPublic)
                            candidates.RemoveAll(ctor => IsParamMatch(ctor.Parameters, existingCtor.Parameters.Select(p => (INamedTypeSymbol)p.Type).ToArray()));
                        continue;
                    }
                    var ctor = new ConstructorSignature(
                        Type,
                        GetSummaryPortion(existingCtor.GetDocumentationCommentXml()),
                        null,
                        modifiers,
                        parameters.Select(p => new Parameter(
                            p.Name,
                            $"{p.GetDocumentationCommentXml()}",
                            ((INamedTypeSymbol)p.Type).GetCSharpType(_typeFactory)!,
                            null,
                            ValidationType.None,
                            null)).ToArray(),
                        null);
                    candidates.Add(ctor);
                }
            }

            var results = candidates.OrderBy(c => c.Parameters.Count);
            return includeClientOptions
                ? results.FirstOrDefault(c => c.Parameters.Last().Type.EqualsIgnoreNullable(ClientOptions.Type))
                : results.FirstOrDefault();
        }

        private FormattableString? GetSummaryPortion(string? xmlComment)
        {
            if (xmlComment is null)
                return null;

            ReadOnlySpan<char> span = xmlComment.AsSpan();
            int start = span.IndexOf("<summary>");
            if (start == -1)
                return null;
            start += 9;
            int end = span.IndexOf("</summary>");
            if (end == -1)
                return null;
            return $"{span.Slice(start, end - start).Trim().ToString()}";
        }

        private bool IsParamMatch(IReadOnlyList<Parameter> methodParameters, INamedTypeSymbol[] suppressionParameters)
        {
            if (methodParameters.Count != suppressionParameters.Length)
                return false;

            for (int i = 0; i < methodParameters.Count; i++)
            {
                if (!suppressionParameters[i].IsSameType(methodParameters[i].Type))
                    return false;
            }

            return true;
        }

        private MethodSignatureModifiers GetModifiers(IMethodSymbol existingCtor)
        {
            MethodSignatureModifiers result = GetAccessModifier(existingCtor.DeclaredAccessibility);
            if (existingCtor.IsStatic)
            {
                result |= MethodSignatureModifiers.Static;
            }
            if (existingCtor.IsVirtual)
            {
                result |= MethodSignatureModifiers.Virtual;
            }
            return result;
        }

        private MethodSignatureModifiers GetAccessModifier(Accessibility declaredAccessibility) => declaredAccessibility switch
        {
            Accessibility.Public => MethodSignatureModifiers.Public,
            Accessibility.Protected => MethodSignatureModifiers.Protected,
            Accessibility.Internal => MethodSignatureModifiers.Internal,
            _ => MethodSignatureModifiers.Private
        };

        internal bool IsMethodSuppressed(MethodSignature signature)
        {
            if (ExistingType is null)
                return false;

            //[CodeGenSuppress("GetTests", typeof(string), typeof(string), typeof(DateTimeOffset?), typeof(DateTimeOffset?), typeof(int?), typeof(RequestContext))]
            //remove suppressed ctors from the candidates
            foreach (var attribute in ExistingType.GetAttributes().Where(a => a.AttributeClass is not null && a.AttributeClass.Name == "CodeGenSuppressAttribute"))
            {
                if (attribute.ConstructorArguments.Length != 2)
                    continue;
                var methodTarget = attribute.ConstructorArguments[0].Value;
                if (methodTarget is null || !methodTarget.Equals(signature.Name))
                    continue;

                if (IsParamMatch(signature.Parameters, attribute.ConstructorArguments[1].Values.Select(tc => (INamedTypeSymbol)(tc.Value!)).ToArray()))
                    return true;
            }

            return false;
        }

        internal bool HasMatchingCustomMethod(LowLevelClientMethod method)
        {
            if (ExistingType is not null)
            {
                // add custom ctors into the candidates
                foreach (var member in ExistingType.GetMembers())
                {
                    if (member is not IMethodSymbol methodSymbol)
                        continue;

                    if (methodSymbol.Name != method.RequestMethod.Name)
                        continue;

                    if (methodSymbol.Parameters.Length != method.ProtocolMethodSignature.Parameters.Count - 1)
                        continue;

                    if (methodSymbol.Parameters.Last().Type.Name == "CancellationToken")
                        continue;

                    bool allEqual = true;
                    for (int i = 0; i < methodSymbol.Parameters.Length; i++)
                    {
                        if (!((INamedTypeSymbol)methodSymbol.Parameters[i].Type).IsSameType(method.ProtocolMethodSignature.Parameters[i].Type))
                        {
                            allEqual = false;
                            break;
                        }
                    }
                    if (allEqual)
                        return true;
                }
            }

            return false;
        }

        private bool? _hasConvenienceMethods;
        internal bool HasConvenienceMethods => _hasConvenienceMethods ??= AllClientMethods.Any(m => m.ConvenienceMethod is not null && m.ConvenienceMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
    }
}
