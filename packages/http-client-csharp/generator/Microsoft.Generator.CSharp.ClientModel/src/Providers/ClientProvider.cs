// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using Microsoft.Generator.CSharp.ClientModel.Primitives;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
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
        private const string AuthorizationHeaderConstName = "AuthorizationHeader";
        private const string AuthorizationApiKeyPrefixConstName = "AuthorizationApiKeyPrefix";
        private const string ApiKeyCredentialFieldName = "_keyCredential";
        private const string EndpointFieldName = "_endpoint";
        private readonly FormattableString _publicCtorDescription;
        private readonly InputClient _inputClient;
        private readonly InputAuth? _inputAuth;
        private readonly ParameterProvider _endpointParameter;
        private readonly FieldProvider? _clientCachingField;
        private readonly FieldProvider? _apiKeyAuthField;
        private readonly FieldProvider? _authorizationHeaderConstant;
        private readonly FieldProvider? _authorizationApiKeyPrefixConstant;
        private readonly ParameterProvider[] _subClientInternalConstructorParams;
        private IReadOnlyList<Lazy<ClientProvider>>? _subClients;
        private ParameterProvider? _clientOptionsParameter;
        private ClientOptionsProvider? _clientOptions;
        private RestClientProvider? _restClient;

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
            _apiKeyAuthField = apiKey != null ? new FieldProvider(
                FieldModifiers.Private | FieldModifiers.ReadOnly,
                ClientModelPlugin.Instance.TypeFactory.KeyCredentialType,
                ApiKeyCredentialFieldName,
                this,
                description: $"A credential used to authenticate to the service.") : null;
            _authorizationHeaderConstant = apiKey?.Name != null ? new(
                FieldModifiers.Private | FieldModifiers.Const,
                typeof(string),
                AuthorizationHeaderConstName,
                this,
                initializationValue: Literal(apiKey.Name)) : null;
            _authorizationApiKeyPrefixConstant = apiKey?.Prefix != null ? new(
                FieldModifiers.Private | FieldModifiers.Const,
                typeof(string),
                AuthorizationApiKeyPrefixConstName,
                this,
                initializationValue: Literal(apiKey.Prefix)) : null;
            EndpointField = new(
                FieldModifiers.Private | FieldModifiers.ReadOnly,
                typeof(Uri),
                EndpointFieldName,
                this);
            PipelineProperty = new(
                description: $"The HTTP pipeline for sending and receiving REST requests and responses.",
                modifiers: MethodSignatureModifiers.Public,
                type: typeof(ClientPipeline),
                name: "Pipeline",
                body: new AutoPropertyBody(false),
                enclosingType: this);

            _subClientInternalConstructorParams = _apiKeyAuthField != null
                ? [PipelineProperty.AsParameter, _apiKeyAuthField.AsParameter, _endpointParameter]
                : [PipelineProperty.AsParameter, _endpointParameter];

            if (_inputClient.Parent != null)
            {
                _clientCachingField = new FieldProvider(
                    FieldModifiers.Private,
                    Type,
                    $"_cached{Name}",
                    this);
            }

            _endpointParameterName = new(GetEndpointParameterName);
        }

        private List<ParameterProvider>? _uriParameters;
        internal IReadOnlyList<ParameterProvider> GetUriParameters()
        {
            if (_uriParameters is null)
            {
                _ = Constructors;
            }
            return _uriParameters ?? [];
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

            if (_apiKeyAuthField != null && _authorizationHeaderConstant != null)
            {
                fields.Add(_authorizationHeaderConstant);
                fields.Add(_apiKeyAuthField);

                if (_authorizationApiKeyPrefixConstant != null)
                {
                    fields.Add(_authorizationApiKeyPrefixConstant);
                }
            }

            // Add optional client parameters as fields
            foreach (var p in _inputClient.Parameters)
            {
                if (!p.IsEndpoint)
                {
                    var type = ClientModelPlugin.Instance.TypeFactory.CreateCSharpType(p.Type);
                    if (type != null)
                    {
                        fields.Add(new(
                            FieldModifiers.Private | FieldModifiers.ReadOnly,
                            type,
                            "_" + p.Name.ToVariableName(),
                            this));
                    }
                }
            }

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
                foreach (var p in _subClientInternalConstructorParams)
                {
                    var assignment = p.Field?.Assign(p).Terminate() ?? p.Property?.Assign(p).Terminate();
                    if (assignment != null)
                    {
                        body.Add(assignment);
                    }
                }
                var subClientConstructor = new ConstructorProvider(
                    new ConstructorSignature(Type, _publicCtorDescription, MethodSignatureModifiers.Internal, _subClientInternalConstructorParams),
                    body,
                    this);

                return [mockingConstructor, subClientConstructor];
            }

            var requiredParameters = GetRequiredParameters();
            ParameterProvider[] primaryConstructorParameters = [_endpointParameter, .. requiredParameters, ClientOptionsParameter];
            var primaryConstructor = new ConstructorProvider(
                new ConstructorSignature(Type, _publicCtorDescription, MethodSignatureModifiers.Public, primaryConstructorParameters),
                BuildPrimaryConstructorBody(primaryConstructorParameters),
                this);

            // If the endpoint parameter contains an initialization value, it is not required.
            ParameterProvider[] secondaryConstructorParameters = _endpointParameter.InitializationValue is null
                ? [_endpointParameter, .. requiredParameters]
                : [.. requiredParameters];
            var secondaryConstructor = BuildSecondaryConstructor(secondaryConstructorParameters, primaryConstructorParameters);
            var shouldIncludeMockingConstructor = secondaryConstructorParameters.Length > 0 || _apiKeyAuthField != null;
            return shouldIncludeMockingConstructor
                ? [ConstructorProviderHelper.BuildMockingConstructor(this), secondaryConstructor, primaryConstructor]
                : [secondaryConstructor, primaryConstructor];
        }

        private IReadOnlyList<ParameterProvider> GetRequiredParameters()
        {
            List<ParameterProvider> requiredParameters = [];
            _uriParameters = [];

            ParameterProvider? currentParam = null;
            foreach (var parameter in _inputClient.Parameters)
            {
                if (parameter.IsRequired && !parameter.IsEndpoint)
                {
                    currentParam = ClientModelPlugin.Instance.TypeFactory.CreateParameter(parameter);
                    currentParam.Field = Fields.FirstOrDefault(f => f.Name == "_" + parameter.Name);
                    requiredParameters.Add(currentParam);
                }
                if (parameter.Location == RequestLocation.Uri)
                {
                    _uriParameters.Add(currentParam ?? ClientModelPlugin.Instance.TypeFactory.CreateParameter(parameter));
                }
            }

            if (_apiKeyAuthField is not null)
                requiredParameters.Add(_apiKeyAuthField.AsParameter);

            return requiredParameters;
        }

        private MethodBodyStatement[] BuildPrimaryConstructorBody(IReadOnlyList<ParameterProvider> primaryConstructorParameters)
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
            ValueExpression perRetryPolicies = New.Array(typeof(PipelinePolicy));
            if (_authorizationHeaderConstant != null && _apiKeyAuthField != null)
            {
                // new PipelinePolicy[] { ApiKeyAuthenticationPolicy.CreateHeaderApiKeyPolicy(_keyCredential, AuthorizationHeader) }
                ValueExpression[] perRetryPolicyArgs = _authorizationApiKeyPrefixConstant != null
                    ? [_apiKeyAuthField, _authorizationHeaderConstant, _authorizationApiKeyPrefixConstant]
                    : [_apiKeyAuthField, _authorizationHeaderConstant];
                var perRetryPolicy = Static<ApiKeyAuthenticationPolicy>().Invoke(
                    nameof(ApiKeyAuthenticationPolicy.CreateHeaderApiKeyPolicy), perRetryPolicyArgs).As<ApiKeyAuthenticationPolicy>();
                perRetryPolicies = New.Array(typeof(PipelinePolicy), isInline: true, perRetryPolicy);
            }

            body.Add(PipelineProperty.Assign(ClientPipelineSnippets.Create(
                ClientOptionsParameter, New.Array(typeof(PipelinePolicy)), perRetryPolicies, New.Array(typeof(PipelinePolicy)))).Terminate());

            var clientOptionsPropertyDict = ClientOptions.Properties.ToDictionary(p => p.Name.ToCleanName());
            foreach (var f in Fields)
            {
                if (f != _apiKeyAuthField
                    && f != EndpointField
                    && !f.Modifiers.HasFlag(FieldModifiers.Const)
                    && clientOptionsPropertyDict.TryGetValue(f.Name.ToCleanName(), out var optionsProperty))
                {
                    body.Add(f.Assign(ClientOptionsParameter.Property(optionsProperty.Name)).Terminate());
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
                foreach (var param in subClientInstance._subClientInternalConstructorParams)
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

                var factoryMethod = new MethodProvider(
                    new(
                        $"Get{subClient.Value.Name}Client",
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
