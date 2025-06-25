// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using Microsoft.TypeSpec.Generator.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.ClientModel.Utilities;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Utilities;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public class ClientProvider : TypeProvider
    {
        private record AuthFields(FieldProvider AuthField);
        private record ApiKeyFields(FieldProvider AuthField, FieldProvider AuthorizationHeaderField, FieldProvider? AuthorizationApiKeyPrefixField) : AuthFields(AuthField);
        private record OAuth2Fields(FieldProvider AuthField, FieldProvider AuthorizationScopesField) : AuthFields(AuthField);

        private const string AuthorizationHeaderConstName = "AuthorizationHeader";
        private const string AuthorizationApiKeyPrefixConstName = "AuthorizationApiKeyPrefix";
        private const string ApiKeyCredentialFieldName = "_keyCredential";
        private const string TokenCredentialScopesFieldName = "AuthorizationScopes";
        private const string TokenCredentialFieldName = "_tokenCredential";
        private const string EndpointFieldName = "_endpoint";
        private const string ClientSuffix = "Client";
        private readonly FormattableString _publicCtorDescription;
        private readonly InputClient _inputClient;
        private readonly InputAuth? _inputAuth;
        private readonly ParameterProvider _endpointParameter;
        /// <summary>
        /// This field is not one of the fields in this client, but the field in my parent client to get myself.
        /// </summary>
        private readonly FieldProvider? _clientCachingField;

        private readonly ApiKeyFields? _apiKeyAuthFields;
        private readonly OAuth2Fields? _oauth2Fields;

        private FieldProvider? _apiVersionField;
        private readonly Lazy<IReadOnlyList<ParameterProvider>> _subClientInternalConstructorParams;
        private readonly Lazy<IReadOnlyList<ClientProvider>> _subClients;
        private RestClientProvider? _restClient;
        private readonly IReadOnlyList<InputParameter> _allClientParameters;
        private Lazy<IReadOnlyList<FieldProvider>> _additionalClientFields;

        private Dictionary<InputOperation, ScmMethodProviderCollection>? _methodCache;
        private Dictionary<InputOperation, ScmMethodProviderCollection> MethodCache => _methodCache ??= [];

        public ParameterProvider? ClientOptionsParameter { get; }

        protected override FormattableString BuildDescription() => DocHelpers.GetFormattableDescription(_inputClient.Summary, _inputClient.Doc) ?? FormattableStringHelpers.Empty;

        // for mocking
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        protected ClientProvider()
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        {
        }

        public ClientProvider(InputClient inputClient)
        {
            CleanOperationNames(inputClient);

            _inputClient = inputClient;
            _inputAuth = ScmCodeModelGenerator.Instance.InputLibrary.InputNamespace.Auth;
            _endpointParameter = BuildClientEndpointParameter();
            _publicCtorDescription = $"Initializes a new instance of {Name}.";
            ClientOptions = _inputClient.Parent is null ? new ClientOptionsProvider(_inputClient, this) : null;
            ClientOptionsParameter = ClientOptions != null ? ScmKnownParameters.ClientOptions(ClientOptions.Type) : null;

            var apiKey = _inputAuth?.ApiKey;
            var keyCredentialType = ScmCodeModelGenerator.Instance.TypeFactory.ClientPipelineApi.KeyCredentialType;
            if (apiKey != null && keyCredentialType != null)
            {
                var apiKeyAuthField = new FieldProvider(
                    FieldModifiers.Private | FieldModifiers.ReadOnly,
                    keyCredentialType,
                    ApiKeyCredentialFieldName,
                    this,
                    description: $"A credential used to authenticate to the service.");
                var authorizationHeaderField = new FieldProvider(
                    FieldModifiers.Private | FieldModifiers.Const,
                    typeof(string),
                    AuthorizationHeaderConstName,
                    this,
                    initializationValue: Literal(apiKey.Name));
                var authorizationApiKeyPrefixField = apiKey.Prefix != null ?
                    new FieldProvider(
                        FieldModifiers.Private | FieldModifiers.Const,
                        typeof(string),
                        AuthorizationApiKeyPrefixConstName,
                        this,
                        initializationValue: Literal(apiKey.Prefix)) :
                    null;
                // skip auth fields for sub-clients
                _apiKeyAuthFields = ClientOptions is null ? null : new(apiKeyAuthField, authorizationHeaderField, authorizationApiKeyPrefixField);
            }
            // in this generator, the type of TokenCredential is null therefore these code will never be executed, but it should be invoked in other generators that could support it.
            var tokenAuth = _inputAuth?.OAuth2;
            var tokenCredentialType = ScmCodeModelGenerator.Instance.TypeFactory.ClientPipelineApi.TokenCredentialType;
            if (tokenAuth != null && tokenCredentialType != null)
            {
                var tokenCredentialField = new FieldProvider(
                    FieldModifiers.Private | FieldModifiers.ReadOnly,
                    tokenCredentialType,
                    TokenCredentialFieldName,
                    this,
                    description: $"A credential used to authenticate to the service.");
                var tokenCredentialScopesField = new FieldProvider(
                    FieldModifiers.Private | FieldModifiers.Static | FieldModifiers.ReadOnly,
                    typeof(string[]),
                    TokenCredentialScopesFieldName,
                    this,
                    initializationValue: New.Array(typeof(string), tokenAuth.Scopes.Select(Literal).ToArray()));
                // skip auth fields for sub-clients
                _oauth2Fields = ClientOptions is null ? null : new(tokenCredentialField, tokenCredentialScopesField);
            }
            EndpointField = new(
                FieldModifiers.Private | FieldModifiers.ReadOnly,
                typeof(Uri),
                EndpointFieldName,
                this);
            PipelineProperty = new(
                description: $"The HTTP pipeline for sending and receiving REST requests and responses.",
                modifiers: MethodSignatureModifiers.Public,
                type: ScmCodeModelGenerator.Instance.TypeFactory.ClientPipelineApi.ClientPipelineType,
                name: "Pipeline",
                body: new AutoPropertyBody(false),
                enclosingType: this);

            if (_inputClient.Parent != null)
            {
                // _clientCachingField will only have subClients (children)
                // The sub-client caching field for the sub-client which is used for building the caching fields within a parent.
                _clientCachingField = new FieldProvider(
                    FieldModifiers.Private,
                    Type,
                    $"_cached{Name}",
                    this);
            }

            _endpointParameterName = new(GetEndpointParameterName);
            _additionalClientFields = new(BuildAdditionalClientFields);
            _subClientInternalConstructorParams = new(GetSubClientInternalConstructorParameters);
            _clientParameters = new(GetClientParameters);
            _subClients = new(GetSubClients);
            _allClientParameters = GetAllClientParameters();
        }

        private static void CleanOperationNames(InputClient inputClient)
        {
            foreach (var serviceMethod in inputClient.Methods)
            {
                var updatedOperationName = GetCleanOperationName(serviceMethod);
                serviceMethod.Update(name: updatedOperationName);
                serviceMethod.Operation.Update(name: updatedOperationName);
            }
        }

        private static string GetCleanOperationName(InputServiceMethod serviceMethod)
        {
            var operationName = serviceMethod.Operation.Name.ToIdentifierName();
            // Replace List with Get as .NET convention is to use Get for list operations.
            if (operationName.StartsWith("List", StringComparison.Ordinal))
            {
                operationName = $"Get{operationName.Substring(4)}";
            }
            return operationName;
        }

        private string? _namespace;
        // This `BuildNamespace` method has been called twice - one when building the `Type`, the other is trying to find the CustomCodeView, both of them are required.
        // therefore here to avoid this being called twice because this method now reports a diagnostic, we cache the result.
        protected override string BuildNamespace() => _namespace ??= BuildNamespaceCore();

        private string BuildNamespaceCore()
        {
            // if namespace is empty, we fallback to the root namespace
            if (string.IsNullOrEmpty(_inputClient.Namespace))
            {
                return base.BuildNamespace();
            }
            var ns = ScmCodeModelGenerator.Instance.TypeFactory.GetCleanNameSpace(_inputClient.Namespace);

            // figure out if this namespace has been changed for this client
            if (!IsLastNamespaceSegmentTheSame(ns, _inputClient.Namespace))
            {
                ScmCodeModelGenerator.Instance.Emitter.ReportDiagnostic(DiagnosticCodes.ClientNamespaceConflict, $"namespace {_inputClient.Namespace} conflicts with client {_inputClient.Name}, please use `@clientName` to specify a different name for the client.", _inputClient.CrossLanguageDefinitionId);
            }
            return ns;
        }

        /// <summary>
        /// Checks if two namespaces share the same last segment
        /// </summary>
        /// <param name="left">the first namespace</param>
        /// <param name="right">the second namespace</param>
        /// <returns></returns>
        internal static bool IsLastNamespaceSegmentTheSame(string left, string right)
        {
            // finish this via Span API
            var leftSpan = left.AsSpan();
            var rightSpan = right.AsSpan();
            // swap if left is longer, we ensure left is the shorter one
            if (leftSpan.Length > rightSpan.Length)
            {
                var temp = leftSpan;
                leftSpan = rightSpan;
                rightSpan = temp;
            }
            for (int i = 1; i <= leftSpan.Length; i++)
            {
                var lc = leftSpan[^i];
                var rc = rightSpan[^i];
                // check if each char is the same from the right-most side
                // if both of them are dot, we finished scanning the last segment - and if we could be here, meaning all of them are the same, return true.
                if (lc == '.' && rc == '.')
                {
                    return true;
                }
                // if these are different - there is one different character, return false.
                if (lc != rc)
                {
                    return false;
                }
            }

            // we come here because we run out of characters in left - which means left does not have a dot.
            // if they have the same length, they are identical, return true
            if (leftSpan.Length == rightSpan.Length)
            {
                return true;
            }
            // otherwise, right is longer, we check its next character, if it is the dot, return true, otherwise return false.
            return rightSpan[^(leftSpan.Length + 1)] == '.';
        }

        private IReadOnlyList<ParameterProvider> GetSubClientInternalConstructorParameters()
        {
            var subClientParameters = new List<ParameterProvider>
            {
                PipelineProperty.AsParameter
            };

            if (_apiKeyAuthFields != null)
            {
                subClientParameters.Add(_apiKeyAuthFields.AuthField.AsParameter);
            }
            if (_oauth2Fields != null)
            {
                subClientParameters.Add(_oauth2Fields.AuthField.AsParameter);
            }
            subClientParameters.Add(_endpointParameter);
            subClientParameters.AddRange(ClientParameters);

            return subClientParameters;
        }

        private Lazy<IReadOnlyList<ParameterProvider>> _clientParameters;
        internal IReadOnlyList<ParameterProvider> ClientParameters => _clientParameters.Value;
        private IReadOnlyList<ParameterProvider> GetClientParameters()
        {
            var parameters = new List<ParameterProvider>(_additionalClientFields.Value.Count);
            foreach (var field in _additionalClientFields.Value)
            {
                parameters.Add(field.AsParameter);
            }
            return parameters;
        }

        private Lazy<string?> _endpointParameterName;
        private InputParameter? _inputEndpointParam;
        internal string? EndpointParameterName => _endpointParameterName.Value;

        private string? GetEndpointParameterName()
        {
            foreach (var param in _inputClient.Parameters)
            {
                if (param.IsEndpoint)
                {
                    //this will be the beginning of the url string so we will skip it when creating the uri builder
                    return $"{{{param.Name}}}";
                }
            }
            return null;
        }

        /// <summary>
        /// Gets the corresponding <see cref="RestClientProvider"/> for this client.
        /// </summary>
        public RestClientProvider RestClient => _restClient ??= new RestClientProvider(_inputClient, this);
        public ClientOptionsProvider? ClientOptions { get; }

        public PropertyProvider PipelineProperty { get; }
        public FieldProvider EndpointField { get; }

        public IReadOnlyList<ClientProvider> SubClients => _subClients.Value;

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", $"{Name}.cs");

        protected override string BuildName() => _inputClient.Name.ToIdentifierName();

        protected override FieldProvider[] BuildFields()
        {
            List<FieldProvider> fields = [EndpointField];

            if (_apiKeyAuthFields != null)
            {
                fields.Add(_apiKeyAuthFields.AuthField);
                fields.Add(_apiKeyAuthFields.AuthorizationHeaderField);
                if (_apiKeyAuthFields.AuthorizationApiKeyPrefixField != null)
                {
                    fields.Add(_apiKeyAuthFields.AuthorizationApiKeyPrefixField);
                }
            }

            if (_oauth2Fields != null)
            {
                fields.Add(_oauth2Fields.AuthField);
                fields.Add(_oauth2Fields.AuthorizationScopesField);
            }

            fields.AddRange(_additionalClientFields.Value);

            // add sub-client caching fields
            foreach (var subClient in _subClients.Value)
            {
                if (subClient._clientCachingField != null)
                {
                    fields.Add(subClient._clientCachingField);
                }
            }

            return [.. fields];
        }

        private IReadOnlyList<FieldProvider> BuildAdditionalClientFields()
        {
            var fields = new List<FieldProvider>();
            // Add optional client parameters as fields
            foreach (var p in _allClientParameters)
            {
                if (!p.IsEndpoint)
                {
                    var type = p is { IsApiVersion: true, Type: InputEnumType enumType }
                        ? ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(enumType.ValueType)
                        : ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(p.Type);

                    if (type != null)
                    {
                        FieldProvider field = new(
                            FieldModifiers.Private | FieldModifiers.ReadOnly,
                            type.WithNullable(!p.IsRequired),
                            "_" + p.Name.ToVariableName(),
                            this,
                            wireInfo: new PropertyWireInformation(
                                ScmCodeModelGenerator.Instance.TypeFactory.GetSerializationFormat(p.Type),
                                p.IsRequired,
                                false,
                                p.Type is InputNullableType,
                                false,
                                p.NameInRequest));
                        if (p.IsApiVersion)
                        {
                            _apiVersionField = field;
                        }
                        fields.Add(field);
                    }
                }
            }
            return fields;
        }

        protected override PropertyProvider[] BuildProperties()
        {
            return [PipelineProperty];
        }

        protected override ConstructorProvider[] BuildConstructors()
        {
            var mockingConstructor = ConstructorProviderHelper.BuildMockingConstructor(this);
            // handle sub-client constructors
            if (ClientOptionsParameter is null)
            {
                List<MethodBodyStatement> body = new(3) { EndpointField.Assign(_endpointParameter).Terminate() };
                foreach (var p in _subClientInternalConstructorParams.Value)
                {
                    var assignment = p.Field?.Assign(p).Terminate() ?? p.Property?.Assign(p).Terminate();
                    if (assignment != null)
                    {
                        body.Add(assignment);
                    }
                }
                var subClientConstructor = new ConstructorProvider(
                    new ConstructorSignature(Type, _publicCtorDescription, MethodSignatureModifiers.Internal, _subClientInternalConstructorParams.Value),
                    body,
                    this);

                return [mockingConstructor, subClientConstructor];
            }

            // we need to construct two sets of constructors for both auth if we supported any.
            var primaryConstructors = new List<ConstructorProvider>();
            var secondaryConstructors = new List<ConstructorProvider>();

            // if there is key auth
            if (_apiKeyAuthFields != null)
            {
                AppendConstructors(_apiKeyAuthFields, primaryConstructors, secondaryConstructors);
            }
            // if there is oauth2 auth
            if (_oauth2Fields != null)
            {
                AppendConstructors(_oauth2Fields, primaryConstructors, secondaryConstructors);
            }

            bool onlyContainsUnsupportedAuth = _inputAuth != null && _apiKeyAuthFields == null && _oauth2Fields == null;
            // if there is no auth
            if (_apiKeyAuthFields == null && _oauth2Fields == null)
            {
                AppendConstructors(null, primaryConstructors, secondaryConstructors, onlyContainsUnsupportedAuth);
            }

            var shouldIncludeMockingConstructor = !onlyContainsUnsupportedAuth && secondaryConstructors.All(c => c.Signature.Parameters.Count > 0);

            return shouldIncludeMockingConstructor
                ? [ConstructorProviderHelper.BuildMockingConstructor(this), .. secondaryConstructors, .. primaryConstructors]
                : [.. secondaryConstructors, .. primaryConstructors];

            void AppendConstructors(
                AuthFields? authFields,
                List<ConstructorProvider> primaryConstructors,
                List<ConstructorProvider> secondaryConstructors,
                bool onlyContainsUnsupportedAuth = false)
            {
                var requiredParameters = GetRequiredParameters(authFields?.AuthField);
                ParameterProvider[] primaryConstructorParameters = [_endpointParameter, .. requiredParameters, ClientOptionsParameter];
                // If auth exists but it's not supported, we will make the constructor internal.
                var constructorModifier = onlyContainsUnsupportedAuth ? MethodSignatureModifiers.Internal : MethodSignatureModifiers.Public;
                var primaryConstructor = new ConstructorProvider(
                    new ConstructorSignature(Type, _publicCtorDescription, constructorModifier, primaryConstructorParameters),
                    BuildPrimaryConstructorBody(primaryConstructorParameters, authFields),
                    this);

                primaryConstructors.Add(primaryConstructor);

                // If the endpoint parameter contains an initialization value, it is not required.
                ParameterProvider[] secondaryConstructorParameters = _endpointParameter.InitializationValue is null
                    ? [_endpointParameter, .. requiredParameters]
                    : [.. requiredParameters];
                var secondaryConstructor = BuildSecondaryConstructor(secondaryConstructorParameters, primaryConstructorParameters, constructorModifier);

                secondaryConstructors.Add(secondaryConstructor);
            }
        }

        private IReadOnlyList<ParameterProvider> GetRequiredParameters(FieldProvider? authField)
        {
            List<ParameterProvider> requiredParameters = [];

            foreach (var parameter in _allClientParameters)
            {
                if (parameter.IsRequired && !parameter.IsEndpoint && !parameter.IsApiVersion)
                {
                    ParameterProvider? currentParam = CreateParameter(parameter);
                    if (currentParam != null)
                    {
                        requiredParameters.Add(currentParam);
                    }
                }
            }

            if (authField is not null)
            {
                var authParameter = authField.AsParameter;
                authParameter.Update(name: "credential");
                requiredParameters.Add(authParameter);
            }

            return requiredParameters;
        }

        private ParameterProvider? CreateParameter(InputParameter parameter)
        {
            var param = ScmCodeModelGenerator.Instance.TypeFactory.CreateParameter(parameter);
            if (param != null)
            {
                param.Field = Fields.FirstOrDefault(f => f.Name == "_" + parameter.Name);
            }

            return param;
        }

        private MethodBodyStatement[] BuildPrimaryConstructorBody(IReadOnlyList<ParameterProvider> primaryConstructorParameters, AuthFields? authFields)
        {
            if (ClientOptions is null || ClientOptionsParameter is null)
            {
                return [MethodBodyStatement.Empty];
            }
            AssignmentExpression endpointAssignment;
            if (_endpointParameter.Type.Equals(typeof(string)))
            {
                var serverTemplate = _inputEndpointParam!.ServerUrlTemplate;
                endpointAssignment = EndpointField.Assign(
                    New.Instance(typeof(Uri),
                        new FormattableStringExpression(serverTemplate!, [_endpointParameter])));
            }
            else
            {
                endpointAssignment = EndpointField.Assign(_endpointParameter);
            }
            List<MethodBodyStatement> body = [
                ClientOptionsParameter.Assign(ClientOptionsParameter.InitializationValue!, nullCoalesce: true).Terminate(),
                MethodBodyStatement.EmptyLine,
                endpointAssignment.Terminate()
            ];

            // add other parameter assignments to their corresponding fields
            foreach (var p in primaryConstructorParameters)
            {
                if (p.Field != null)
                {
                    body.Add(p.Field.Assign(p).Terminate());
                }
            }

            // handle pipeline property
            ValueExpression perRetryPolicies;
            switch (authFields)
            {
                case ApiKeyFields keyAuthFields:
                    ValueExpression? keyPrefixExpression = keyAuthFields.AuthorizationApiKeyPrefixField != null ? (ValueExpression)keyAuthFields.AuthorizationApiKeyPrefixField : null;
                    perRetryPolicies = New.Array(ScmCodeModelGenerator.Instance.TypeFactory.ClientPipelineApi.PipelinePolicyType, isInline: true, This.ToApi<ClientPipelineApi>().KeyAuthorizationPolicy(keyAuthFields.AuthField, keyAuthFields.AuthorizationHeaderField, keyPrefixExpression));
                    break;
                case OAuth2Fields oauth2AuthFields:
                    perRetryPolicies = New.Array(ScmCodeModelGenerator.Instance.TypeFactory.ClientPipelineApi.PipelinePolicyType, isInline: true, This.ToApi<ClientPipelineApi>().TokenAuthorizationPolicy(oauth2AuthFields.AuthField, oauth2AuthFields.AuthorizationScopesField));
                    break;
                default:
                    perRetryPolicies = New.Array(ScmCodeModelGenerator.Instance.TypeFactory.ClientPipelineApi.PipelinePolicyType);
                    break;
            }

            body.Add(PipelineProperty.Assign(This.ToApi<ClientPipelineApi>().Create(ClientOptionsParameter, perRetryPolicies)).Terminate());

            var clientOptionsPropertyDict = ClientOptions.Properties.ToDictionary(p => p.Name.ToIdentifierName());
            foreach (var f in Fields)
            {
                if (f == _apiVersionField && ClientOptions.VersionProperty != null)
                {
                    body.Add(f.Assign(ClientOptionsParameter.Property(ClientOptions.VersionProperty.Name)).Terminate());
                }
                else if (clientOptionsPropertyDict.TryGetValue(f.Name.ToIdentifierName(), out var optionsProperty))
                {
                    clientOptionsPropertyDict.TryGetValue(f.Name.ToIdentifierName(), out optionsProperty);
                }
            }

            return [.. body];
        }

        /// <summary>
        /// Builds the secondary constructor for the client. The secondary constructor contains all required parameters as arguments.
        /// </summary>
        /// <param name="secondaryConstructorParameters">The required parameters for the client.</param>
        /// <param name="primaryCtorOrderedParams">The ordered parameters for the primary constructor.</param>
        private ConstructorProvider BuildSecondaryConstructor(
            IReadOnlyList<ParameterProvider> secondaryConstructorParameters,
            IReadOnlyList<ParameterProvider> primaryCtorOrderedParams,
            MethodSignatureModifiers modifier)
        {
            // initialize the arguments to reference the primary constructor
            var primaryCtorInitializer = new ConstructorInitializer(
                false,
                [.. primaryCtorOrderedParams.Select(p => p.InitializationValue ?? p)
             ]);
            var constructorSignature = new ConstructorSignature(
                Type,
                _publicCtorDescription,
                modifier,
                secondaryConstructorParameters,
                Initializer: primaryCtorInitializer);

            return new ConstructorProvider(
                constructorSignature,
                MethodBodyStatement.Empty,
                this);
        }

        public ScmMethodProviderCollection GetMethodCollectionByOperation(InputOperation operation)
        {
            _ = Methods; // Ensure methods are built
            return MethodCache[operation];
        }

        protected override ScmMethodProvider[] BuildMethods()
        {
            var subClients = _subClients.Value;
            var subClientCount = subClients.Count;
            List<ScmMethodProvider> methods = new List<ScmMethodProvider>((_inputClient.Methods.Count * 4) + subClientCount);

            foreach (var serviceMethod in _inputClient.Methods)
            {
                var clientMethods = ScmCodeModelGenerator.Instance.TypeFactory.CreateMethods(serviceMethod, this);
                if (clientMethods != null)
                {
                    MethodCache[serviceMethod.Operation] = clientMethods;
                    methods.AddRange(clientMethods);
                }
            }

            if (subClientCount == 0)
            {
                return [.. methods];
            }

            var parentClientProperties = Properties.ToDictionary(p => p.Name.ToVariableName());
            var parentClientFields = Fields.ToDictionary(f => f.Name.ToVariableName());

            // Build factory accessor methods for the sub-clients
            foreach (var subClient in subClients)
            {
                if (subClient._clientCachingField is null)
                {
                    continue;
                }

                var cachedClientFieldVar = new VariableExpression(subClient.Type, subClient._clientCachingField.Declaration, IsRef: true);
                List<ValueExpression> subClientConstructorArgs = new(3);

                // Populate constructor arguments
                foreach (var param in subClient._subClientInternalConstructorParams.Value)
                {
                    if (parentClientProperties.TryGetValue(param.Name, out var parentProperty))
                    {
                        subClientConstructorArgs.Add(parentProperty);
                    }
                    else if (parentClientFields.TryGetValue(param.Name, out var parentField))
                    {
                        subClientConstructorArgs.Add(parentField);
                    }
                }

                // Create the interlocked compare exchange expression for the body
                var interlockedCompareExchange = Static(typeof(Interlocked)).Invoke(
                    nameof(Interlocked.CompareExchange),
                    [cachedClientFieldVar, New.Instance(subClient.Type, subClientConstructorArgs), Null]);
                var factoryMethodName = subClient.Name.EndsWith(ClientSuffix, StringComparison.OrdinalIgnoreCase)
                    ? $"Get{subClient.Name}"
                    : $"Get{subClient.Name}{ClientSuffix}";

                var factoryMethod = new ScmMethodProvider(
                    new(
                        factoryMethodName,
                        $"Initializes a new instance of {subClient.Type.Name}",
                        MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual,
                        subClient.Type,
                        null,
                        []),
                    // return Volatile.Read(ref _cachedClient) ?? Interlocked.CompareExchange(ref _cachedClient, new Client(_pipeline, _keyCredential, _endpoint), null) ?? _cachedClient;
                    Return(
                        Static(typeof(Volatile)).Invoke(nameof(Volatile.Read), cachedClientFieldVar)
                        .NullCoalesce(interlockedCompareExchange.NullCoalesce(subClient._clientCachingField))),
                    this);
                methods.Add(factoryMethod);
            }

            return [.. methods];
        }

        private ParameterProvider BuildClientEndpointParameter()
        {
            _inputEndpointParam = _inputClient.Parameters.FirstOrDefault(p => p.IsEndpoint);
            if (_inputEndpointParam == null)
            {
                return KnownParameters.Endpoint;
            }

            var endpointParamType = ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(_inputEndpointParam.Type);
            if (endpointParamType == null)
            {
                return KnownParameters.Endpoint;
            }

            ValueExpression? initializationValue = _inputEndpointParam.DefaultValue != null
                ? New.Instance(endpointParamType, Literal(_inputEndpointParam.DefaultValue.Value))
                : null;

            if (endpointParamType.Equals(typeof(string)) && _inputEndpointParam.ServerUrlTemplate != null)
            {
                return new(_inputEndpointParam);
            }

            // Must be a URI endpoint parameter
            return new(
                KnownParameters.Endpoint.Name,
                KnownParameters.Endpoint.Description,
                KnownParameters.Endpoint.Type,
                initializationValue: initializationValue)
            {
                Validation = ParameterValidationType.AssertNotNull
            };
        }

        private IReadOnlyList<ClientProvider> GetSubClients()
        {
            var subClients = new List<ClientProvider>(_inputClient.Children.Count);

            foreach (var client in _inputClient.Children)
            {
                var subClient = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(client);
                if (subClient != null)
                {
                    subClients.Add(subClient);
                }
            }

            return subClients;
        }

        private IReadOnlyList<InputParameter> GetAllClientParameters()
        {
            // Get all parameters from the client and its methods
            var parameters = _inputClient.Parameters.Concat(
                _inputClient.Methods.SelectMany(m => m.Operation.Parameters)
                    .Where(p => p.Kind == InputParameterKind.Client)).DistinctBy(p => p.Name).ToArray();

            foreach (var subClient in _subClients.Value)
            {
                // Add parameters from sub-clients
                parameters = parameters.Concat(subClient.GetAllClientParameters()).DistinctBy(p => p.Name).ToArray();
            }

            return parameters;
        }
    }
}
