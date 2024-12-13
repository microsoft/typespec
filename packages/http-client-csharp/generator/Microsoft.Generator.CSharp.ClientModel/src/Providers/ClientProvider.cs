// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using Microsoft.Generator.CSharp.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
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
        private readonly FieldProvider? _clientCachingField;

        private readonly ApiKeyFields? _apiKeyAuthFields;
        private readonly OAuth2Fields? _oauth2Fields;

        private FieldProvider? _apiVersionField;
        private readonly Lazy<IReadOnlyList<ParameterProvider>> _subClientInternalConstructorParams;
        private IReadOnlyList<Lazy<ClientProvider>>? _subClients;
        private ParameterProvider? _clientOptionsParameter;
        private ClientOptionsProvider? _clientOptions;
        private RestClientProvider? _restClient;
        private readonly InputParameter[] _allClientParameters;
        private Lazy<List<FieldProvider>> _additionalClientFields;

        private ParameterProvider? ClientOptionsParameter => _clientOptionsParameter ??= ClientOptions != null
            ? ScmKnownParameters.ClientOptions(ClientOptions.Type)
            : null;
        private IReadOnlyList<Lazy<ClientProvider>> SubClients => _subClients ??= GetSubClients();

        // for mocking
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        protected ClientProvider()
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        {
        }

        public ClientProvider(InputClient inputClient)
        {
            _inputClient = inputClient;
            _inputAuth = ClientModelPlugin.Instance.InputLibrary.InputNamespace.Auth;
            _endpointParameter = BuildClientEndpointParameter();
            _publicCtorDescription = $"Initializes a new instance of {Name}.";

            var apiKey = _inputAuth?.ApiKey;
            var keyCredentialType = ClientModelPlugin.Instance.TypeFactory.ClientPipelineApi.KeyCredentialType;
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
                _apiKeyAuthFields = new(apiKeyAuthField, authorizationHeaderField, authorizationApiKeyPrefixField);
            }
            // in this plugin, the type of TokenCredential is null therefore these code will never be executed, but it should be invoked in other plugins that could support it.
            var tokenAuth = _inputAuth?.OAuth2;
            var tokenCredentialType = ClientModelPlugin.Instance.TypeFactory.ClientPipelineApi.TokenCredentialType;
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
                _oauth2Fields = new(tokenCredentialField, tokenCredentialScopesField);
            }
            EndpointField = new(
                FieldModifiers.Private | FieldModifiers.ReadOnly,
                typeof(Uri),
                EndpointFieldName,
                this);
            PipelineProperty = new(
                description: $"The HTTP pipeline for sending and receiving REST requests and responses.",
                modifiers: MethodSignatureModifiers.Public,
                type: ClientModelPlugin.Instance.TypeFactory.ClientPipelineApi.ClientPipelineType,
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
            _allClientParameters = _inputClient.Parameters.Concat(_inputClient.Operations.SelectMany(op => op.Parameters).Where(p => p.Kind == InputOperationParameterKind.Client)).DistinctBy(p => p.Name).ToArray();
            _subClientInternalConstructorParams = new(GetSubClientInternalConstructorParameters);
            _clientParameters = new(GetClientParameters);
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

        internal RestClientProvider RestClient => _restClient ??= new RestClientProvider(_inputClient, this);
        internal ClientOptionsProvider? ClientOptions => _clientOptions ??= _inputClient.Parent is null
            ? new ClientOptionsProvider(_inputClient, this)
            : null;

        public PropertyProvider PipelineProperty { get; }
        public FieldProvider EndpointField { get; }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", $"{Name}.cs");

        protected override string BuildName() => _inputClient.Name.ToCleanName();

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
            foreach (var subClient in SubClients)
            {
                if (subClient.Value._clientCachingField != null)
                {
                    fields.Add(subClient.Value._clientCachingField);
                }
            }

            return [.. fields];
        }

        private List<FieldProvider> BuildAdditionalClientFields()
        {
            var fields = new List<FieldProvider>();
            // Add optional client parameters as fields
            foreach (var p in _allClientParameters)
            {
                if (!p.IsEndpoint)
                {
                    var type = p is { IsApiVersion: true, Type: InputEnumType enumType }
                        ? ClientModelPlugin.Instance.TypeFactory.CreateCSharpType(enumType.ValueType)
                        : ClientModelPlugin.Instance.TypeFactory.CreateCSharpType(p.Type);

                    if (type != null)
                    {
                        FieldProvider field = new(
                            FieldModifiers.Private | FieldModifiers.ReadOnly,
                            type.WithNullable(!p.IsRequired),
                            "_" + p.Name.ToVariableName(),
                            this);
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

            // we need to construct two sets of constructors for both auth we supported if any.
            var primaryConstructors = new List<ConstructorProvider>();
            var secondaryConstructors = new List<ConstructorProvider>();

            // if there is key auth
            if (_apiKeyAuthFields != null)
            {
                AppendConstructors(_apiKeyAuthFields, primaryConstructors, secondaryConstructors);
            }
            // if there is oauth2 auth
            if (_oauth2Fields!= null)
            {
                AppendConstructors(_oauth2Fields, primaryConstructors, secondaryConstructors);
            }
            // if there is no auth
            if (_apiKeyAuthFields == null && _oauth2Fields == null)
            {
                AppendConstructors(null, primaryConstructors, secondaryConstructors);
            }
            var shouldIncludeMockingConstructor = secondaryConstructors.All(c => c.Signature.Parameters.Count > 0);
            return shouldIncludeMockingConstructor
                ? [ConstructorProviderHelper.BuildMockingConstructor(this), .. secondaryConstructors, .. primaryConstructors]
                : [.. secondaryConstructors, .. primaryConstructors];

            void AppendConstructors(AuthFields? authFields, List<ConstructorProvider> primaryConstructors, List<ConstructorProvider> secondaryConstructors)
            {
                var requiredParameters = GetRequiredParameters(authFields?.AuthField);
                ParameterProvider[] primaryConstructorParameters = [_endpointParameter, .. requiredParameters, ClientOptionsParameter];
                var primaryConstructor = new ConstructorProvider(
                    new ConstructorSignature(Type, _publicCtorDescription, MethodSignatureModifiers.Public, primaryConstructorParameters),
                    BuildPrimaryConstructorBody(primaryConstructorParameters, authFields),
                    this);

                primaryConstructors.Add(primaryConstructor);

                // If the endpoint parameter contains an initialization value, it is not required.
                ParameterProvider[] secondaryConstructorParameters = _endpointParameter.InitializationValue is null
                    ? [_endpointParameter, .. requiredParameters]
                    : [.. requiredParameters];
                var secondaryConstructor = BuildSecondaryConstructor(secondaryConstructorParameters, primaryConstructorParameters);

                secondaryConstructors.Add(secondaryConstructor);
            }
        }

        private IReadOnlyList<ParameterProvider> GetRequiredParameters(FieldProvider? authField)
        {
            List<ParameterProvider> requiredParameters = [];

            ParameterProvider? currentParam = null;
            foreach (var parameter in _allClientParameters)
            {
                currentParam = null;
                if (parameter.IsRequired && !parameter.IsEndpoint && !parameter.IsApiVersion)
                {
                    currentParam = CreateParameter(parameter);
                    requiredParameters.Add(currentParam);
                }
            }

            if (authField is not null)
                requiredParameters.Add(authField.AsParameter);

            return requiredParameters;
        }

        private ParameterProvider CreateParameter(InputParameter parameter)
        {
            var param = ClientModelPlugin.Instance.TypeFactory.CreateParameter(parameter);
            param.Field = Fields.FirstOrDefault(f => f.Name == "_" + parameter.Name);
            return param;
        }

        private MethodBodyStatement[] BuildPrimaryConstructorBody(IReadOnlyList<ParameterProvider> primaryConstructorParameters, AuthFields? authFields)
        {
            if (ClientOptions is null || ClientOptionsParameter is null)
            {
                return [MethodBodyStatement.Empty];
            }

            List<MethodBodyStatement> body = [
                ClientOptionsParameter.Assign(ClientOptionsParameter.InitializationValue!, nullCoalesce: true).Terminate(),
                MethodBodyStatement.EmptyLine,
                EndpointField.Assign(_endpointParameter).Terminate()
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
                    perRetryPolicies = New.Array(ClientModelPlugin.Instance.TypeFactory.ClientPipelineApi.PipelinePolicyType, isInline: true, This.ToApi<ClientPipelineApi>().KeyAuthorizationPolicy(keyAuthFields.AuthField, keyAuthFields.AuthorizationHeaderField, keyPrefixExpression));
                    break;
                case OAuth2Fields oauth2AuthFields:
                    perRetryPolicies = New.Array(ClientModelPlugin.Instance.TypeFactory.ClientPipelineApi.PipelinePolicyType, isInline: true, This.ToApi<ClientPipelineApi>().TokenAuthorizationPolicy(oauth2AuthFields.AuthField, oauth2AuthFields.AuthorizationScopesField));
                    break;
                default:
                    perRetryPolicies = New.Array(ClientModelPlugin.Instance.TypeFactory.ClientPipelineApi.PipelinePolicyType);
                    break;
            }

            body.Add(PipelineProperty.Assign(This.ToApi<ClientPipelineApi>().Create(ClientOptionsParameter, perRetryPolicies)).Terminate());

            var clientOptionsPropertyDict = ClientOptions.Properties.ToDictionary(p => p.Name.ToCleanName());
            foreach (var f in Fields)
            {
                if (f == _apiVersionField && ClientOptions.VersionProperty != null)
                {
                    body.Add(f.Assign(ClientOptionsParameter.Property(ClientOptions.VersionProperty.Name)).Terminate());
                }
                else if (clientOptionsPropertyDict.TryGetValue(f.Name.ToCleanName(), out var optionsProperty))
                {
                    clientOptionsPropertyDict.TryGetValue(f.Name.ToCleanName(), out optionsProperty);
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
            IReadOnlyList<ParameterProvider> primaryCtorOrderedParams)
        {
            // initialize the arguments to reference the primary constructor
            var primaryCtorInitializer = new ConstructorInitializer(
                false,
                [.. primaryCtorOrderedParams.Select(p => p.InitializationValue ?? p)
             ]);
            var constructorSignature = new ConstructorSignature(
                Type,
                _publicCtorDescription,
                MethodSignatureModifiers.Public,
                secondaryConstructorParameters,
                Initializer: primaryCtorInitializer);

            return new ConstructorProvider(
                constructorSignature,
                MethodBodyStatement.Empty,
                this);
        }

        protected override MethodProvider[] BuildMethods()
        {
            var subClientCount = SubClients.Count;
            List<MethodProvider> methods = new List<MethodProvider>((_inputClient.Operations.Count * 4) + subClientCount);

            // Build methods for all the operations
            foreach (var operation in _inputClient.Operations)
            {
                var clientMethods = ClientModelPlugin.Instance.TypeFactory.CreateMethods(operation, this);
                if (clientMethods != null)
                {
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
            foreach (var subClient in SubClients)
            {
                var subClientInstance = subClient.Value;
                if (subClientInstance._clientCachingField is null)
                {
                    continue;
                }

                var cachedClientFieldVar = new VariableExpression(subClientInstance.Type, subClientInstance._clientCachingField.Declaration, IsRef: true);
                List<ValueExpression> subClientConstructorArgs = new(3);

                // Populate constructor arguments
                foreach (var param in subClientInstance._subClientInternalConstructorParams.Value)
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
                    [cachedClientFieldVar, New.Instance(subClientInstance.Type, subClientConstructorArgs), Null]);
                var factoryMethodName = subClient.Value.Name.EndsWith(ClientSuffix, StringComparison.OrdinalIgnoreCase)
                    ? $"Get{subClient.Value.Name}"
                    : $"Get{subClient.Value.Name}{ClientSuffix}";

                var factoryMethod = new MethodProvider(
                    new(
                        factoryMethodName,
                        $"Initializes a new instance of {subClientInstance.Type.Name}",
                        MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual,
                        subClientInstance.Type,
                        null,
                        []),
                    // return Volatile.Read(ref _cachedClient) ?? Interlocked.CompareExchange(ref _cachedClient, new Client(_pipeline, _keyCredential, _endpoint), null) ?? _cachedClient;
                    Return(
                        Static(typeof(Volatile)).Invoke(nameof(Volatile.Read), cachedClientFieldVar)
                        .NullCoalesce(interlockedCompareExchange.NullCoalesce(subClientInstance._clientCachingField))),
                    this);
                methods.Add(factoryMethod);
            }

            return [.. methods];
        }

        private ParameterProvider BuildClientEndpointParameter()
        {
            var endpointParam = _inputClient.Parameters.FirstOrDefault(p => p.IsEndpoint);
            if (endpointParam == null)
                return KnownParameters.Endpoint;

            ValueExpression? initializationValue = endpointParam.DefaultValue != null
                ? New.Instance(KnownParameters.Endpoint.Type, Literal(endpointParam.DefaultValue.Value))
                : null;

            return new(
                KnownParameters.Endpoint.Name,
                KnownParameters.Endpoint.Description,
                KnownParameters.Endpoint.Type,
                initializationValue: initializationValue)
            {
                Validation = ParameterValidationType.AssertNotNull
            };
        }

        // TODO: Update method to be more efficient
        private IReadOnlyList<Lazy<ClientProvider>> GetSubClients()
        {
            var inputClients = ClientModelPlugin.Instance.InputLibrary.InputNamespace.Clients;
            var subClients = new List<Lazy<ClientProvider>>(inputClients.Count);

            foreach (var client in inputClients)
            {
                // add direct child clients
                if (client.Parent != null && client.Parent == _inputClient.Key)
                {
                    subClients.Add(new(() => ClientModelPlugin.Instance.TypeFactory.CreateClient(client)));
                }
            }

            return subClients;
        }
    }
}
