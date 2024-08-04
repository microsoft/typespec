// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Linq;
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
        private readonly TypeProvider _clientOptions;
        private readonly InputClient _inputClient;
        private readonly InputAuth? _inputAuth;
        private readonly ParameterProvider _clientOptionsParameter;
        private readonly ParameterProvider _endpointParameter;
        private readonly FieldProvider? _apiKeyAuthField;
        private readonly FieldProvider? _authorizationHeaderConstant;
        private readonly FieldProvider? _authorizationApiKeyPrefixConstant;
        private RestClientProvider? _restClient;

        internal RestClientProvider RestClient => _restClient ??= new RestClientProvider(_inputClient, this);

        public ClientProvider(InputClient inputClient)
        {
            _inputClient = inputClient;
            // TO-DO: Implement client options https://github.com/microsoft/typespec/issues/3688
            _clientOptions = new ClientOptionsProvider(inputClient);
            _clientOptionsParameter = ScmKnownParameters.ClientOptions(_clientOptions.Type);
            _inputAuth = ClientModelPlugin.Instance.InputLibrary.InputNamespace.Auth;

            var apiKey = _inputAuth?.ApiKey;
            _apiKeyAuthField = apiKey != null ? new FieldProvider(
                FieldModifiers.Private | FieldModifiers.ReadOnly,
                typeof(ApiKeyCredential),
                ApiKeyCredentialFieldName,
                description: $"A credential used to authenticate to the service.") : null;
            _authorizationHeaderConstant = apiKey?.Name != null ? new(
                FieldModifiers.Private | FieldModifiers.Const,
                typeof(string),
                AuthorizationHeaderConstName,
                initializationValue: Literal(apiKey.Name)) : null;
            _authorizationApiKeyPrefixConstant = apiKey?.Prefix != null ? new(
                FieldModifiers.Private | FieldModifiers.Const,
                typeof(string),
                AuthorizationApiKeyPrefixConstName,
                initializationValue: Literal(apiKey.Prefix)) : null;
            EndpointField = new(
                FieldModifiers.Private | FieldModifiers.ReadOnly,
                typeof(Uri),
                EndpointFieldName);

            _endpointParameter = BuildClientEndpointParameter();
            _publicCtorDescription = $"Initializes a new instance of {Name}.";

            PipelineProperty = new PropertyProvider(
                description: $"The HTTP pipeline for sending and receiving REST requests and responses.",
                modifiers: MethodSignatureModifiers.Public,
                type: typeof(ClientPipeline),
                name: "Pipeline",
                body: new AutoPropertyBody(false));
        }

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

            // TO-DO: Add additional fields for client options https://github.com/microsoft/typespec/issues/3688

            return [.. fields];
        }

        protected override PropertyProvider[] BuildProperties()
        {
            return [PipelineProperty];
        }

        protected override ConstructorProvider[] BuildConstructors()
        {
            ParameterProvider[] primaryConstructorParameters = _apiKeyAuthField != null
                ? [_endpointParameter, _apiKeyAuthField.AsParameter, _clientOptionsParameter]
                : [_endpointParameter, _clientOptionsParameter];
            var primaryConstructor = new ConstructorProvider(
                new ConstructorSignature(Type, _publicCtorDescription, MethodSignatureModifiers.Public, primaryConstructorParameters),
                BuildPrimaryConstructorBody(primaryConstructorParameters),
                this);

            // build the required parameters for the secondary constructor.
            // If the endpoint parameter contains an initialization value, it is not required.
            List<ParameterProvider> requiredParameters = _endpointParameter.InitializationValue == null ? [_endpointParameter] : [];
            if (_apiKeyAuthField != null)
            {
                requiredParameters.Add(_apiKeyAuthField.AsParameter);
            }

            var secondaryConstructor = BuildSecondaryConstructor(requiredParameters, primaryConstructorParameters);
            var shouldIncludeMockingConstructor = requiredParameters.Count > 0 || _apiKeyAuthField != null;
            return shouldIncludeMockingConstructor
                ? [ConstructorProviderHelper.BuildMockingConstructor(this), secondaryConstructor, primaryConstructor]
                : [secondaryConstructor, primaryConstructor];
        }

        private MethodBodyStatement[] BuildPrimaryConstructorBody(IReadOnlyList<ParameterProvider> primaryConstructorParameters)
        {
            List<MethodBodyStatement> body = [
                _clientOptionsParameter.Assign(_clientOptionsParameter.InitializationValue!, nullCoalesce: true).Terminate(),
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
                _clientOptionsParameter, New.Array(typeof(PipelinePolicy)), perRetryPolicies, New.Array(typeof(PipelinePolicy)))).Terminate());

            // TO-DO: Add additional field assignments for client options https://github.com/microsoft/typespec/issues/3688

            return [.. body];
        }

        /// <summary>
        /// Builds the secondary constructor for the client. The secondary constructor contains all required parameters as arguments.
        /// </summary>
        /// <param name="requiredParams">The required parameters for the client.</param>
        /// <param name="primaryCtorOrderedParams">The ordered parameters for the primary constructor.</param>
        private ConstructorProvider BuildSecondaryConstructor(
            IReadOnlyList<ParameterProvider> requiredParams,
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
                requiredParams,
                Initializer: primaryCtorInitializer);

            return new ConstructorProvider(
                constructorSignature,
                MethodBodyStatement.Empty,
                this);
        }

        protected override MethodProvider[] BuildMethods()
        {
            List<MethodProvider> methods = new List<MethodProvider>(_inputClient.Operations.Count * 4);

            // Build methods for all the operations
            foreach (var operation in _inputClient.Operations)
            {
                var clientMethods = ClientModelPlugin.Instance.TypeFactory.CreateMethods(operation, this);
                if (clientMethods != null)
                {
                    methods.AddRange(clientMethods);
                }
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
    }
}
