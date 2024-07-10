// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Reflection.Metadata;
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
        private const string PipelineFieldName = "_pipeline";
        private readonly FormattableString _publicCtorDescription;
        private readonly TypeProvider _clientOptions;
        private readonly InputClient _inputClient;
        private readonly InputAuth? _inputAuth;
        private readonly ParameterProvider? _apiKeyAuthParameter;
        private readonly ParameterProvider _clientOptionsParameter;
        private readonly FieldProvider? _authorizationHeaderConstant;
        private readonly FieldProvider? _authorizationApiKeyPrefixConstant;
        private readonly IReadOnlyList<ParameterProvider> _clientParameters;
        private readonly bool _isSubClient;

        public ClientProvider(InputClient inputClient)
        {
            _inputClient = inputClient;
            // TO-DO: Implement sub-client support https://github.com/microsoft/typespec/issues/3690
            _isSubClient = inputClient.Parent != null;
            // TO-DO: Implement client options https://github.com/microsoft/typespec/issues/3688
            _clientOptions = new ClientOptionsProvider(inputClient);
            _clientOptionsParameter = new ParameterProvider(
                "options",
                $"The options for configuring the client.",
                _clientOptions.Type.WithNullable(true),
                defaultValue: New.Instance(_clientOptions.Type.WithNullable(true)));
            _inputAuth = ClientModelPlugin.Instance.InputLibrary.InputNamespace.Auth;
            _apiKeyAuthParameter = _inputAuth?.ApiKey != null ? ScmKnownParameters.ApiKeyAuth : null;
            _authorizationHeaderConstant = BuildAuthHeaderConstant();
            _authorizationApiKeyPrefixConstant = BuildAuthApiKeyPrefixConstant();
            _clientParameters = GetClientParameters();
            _publicCtorDescription = $"Initializes a new instance of {Name}.";
            PipelineField = new FieldProvider(FieldModifiers.Private | FieldModifiers.ReadOnly, typeof(ClientPipeline), PipelineFieldName);
        }

        public FieldProvider PipelineField { get; }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", $"{Name}.cs");

        protected override string BuildName() => _inputClient.Name.ToCleanName();

        protected override FieldProvider[] BuildFields()
        {
            int estimatedCapacity = _clientParameters.Count + 3;
            List<FieldProvider> fields = new(estimatedCapacity) { PipelineField };

            if (_apiKeyAuthParameter != null && _authorizationHeaderConstant != null)
            {
                fields.Add(_authorizationHeaderConstant);
                fields.Add(_apiKeyAuthParameter.AsField);

                if (_authorizationApiKeyPrefixConstant != null)
                {
                    fields.Add(_authorizationApiKeyPrefixConstant);
                }
            }

            foreach (var parameter in _clientParameters)
            {
                fields.Add(parameter.AsField);
            }

            return [.. fields];
        }

        protected override ConstructorProvider[] BuildConstructors()
        {
            if (_isSubClient)
            {
                return [BuildMockingConstructor(), BuildSubClientInternalConstructor()];
            }

            var requiredParameters = _apiKeyAuthParameter != null ? [_apiKeyAuthParameter] : new List<ParameterProvider>();
            var optionalParameters = new List<ParameterProvider>();
            var orderedParams = new List<ParameterProvider>(_clientParameters.Count);
            ParameterProvider? endpointParam = null;

            foreach (var parameter in _clientParameters)
            {
                if (parameter.Name == KnownParameters.Endpoint.Name)
                {
                    endpointParam = parameter;
                    orderedParams.Add(endpointParam);
                }
                else if (parameter.DefaultValue == null && parameter.Validation != ParameterValidationType.None)
                {
                    requiredParameters.Add(parameter);
                }
                else
                {
                    optionalParameters.Add(parameter);
                }
            }

            if (!_isSubClient)
            {
                optionalParameters.Add(_clientOptionsParameter);
            }

            // order the constructor parameters as (endpoint, requiredParameters, optionalParameters).
            orderedParams.AddRange(requiredParameters);
            orderedParams.AddRange(optionalParameters);

            var primaryConstructor = new ConstructorProvider(
                new ConstructorSignature(Type, _publicCtorDescription, MethodSignatureModifiers.Public, orderedParams),
                BuildPrimaryConstructorBody(orderedParams),
                this);
            var secondaryConstructor = BuildSecondaryConstructor(requiredParameters, orderedParams, endpointParam);

            if (requiredParameters.Count > 0 || _apiKeyAuthParameter != null)
            {
                return [BuildMockingConstructor(), secondaryConstructor, primaryConstructor];
            }
            else
            {
                return [secondaryConstructor, primaryConstructor];
            }
        }

        private MethodBodyStatement[] BuildPrimaryConstructorBody(IReadOnlyList<ParameterProvider> orderedParameters)
        {
            MethodBodyStatement? clientOptions = null;
            List<MethodBodyStatement> body = [];

            foreach (var p in orderedParameters)
            {
                // handle options parameter
                if (p == _clientOptionsParameter)
                {
                    var defaultValue = _clientOptionsParameter.DefaultValue ?? New.Instance(_clientOptions.Type.WithNullable(true));
                    clientOptions = p.Assign(defaultValue, nullCoalesce: true).Terminate();
                }
                else
                {
                    body.Add(p.AsField.Assign(p).Terminate());
                }
            }

            // handle pipeline field
            ValueExpression perRetryPolicies = New.Array(typeof(PipelinePolicy));
            if (_authorizationHeaderConstant != null && _apiKeyAuthParameter != null)
            {
                // new PipelinePolicy[] { ApiKeyAuthenticationPolicy.CreateHeaderApiKeyPolicy(_keyCredential, AuthorizationHeader) }
                ValueExpression[] perRetryPolicyArgs = _authorizationApiKeyPrefixConstant != null
                    ? [_apiKeyAuthParameter.AsField, _authorizationHeaderConstant, _authorizationApiKeyPrefixConstant]
                    : [_apiKeyAuthParameter.AsField, _authorizationHeaderConstant];
                var perRetryPolicy = Static<ApiKeyAuthenticationPolicy>().Invoke(
                    nameof(ApiKeyAuthenticationPolicy.CreateHeaderApiKeyPolicy), perRetryPolicyArgs).As<ApiKeyAuthenticationPolicy>();
                perRetryPolicies = New.Array(typeof(PipelinePolicy), isInline: true, perRetryPolicy);
            }

            body.Add(PipelineField.Assign(ClientPipelineSnippets.Create(
                _clientOptionsParameter, New.Array(typeof(PipelinePolicy)), perRetryPolicies, New.Array(typeof(PipelinePolicy)))).Terminate());

            return clientOptions != null ? [clientOptions, .. body] : [.. body];
        }

        /// <summary>
        /// Builds the secondary constructor for the client. The secondary constructor contains the endpoint parameter
        /// and all the required parameters as arguments.
        /// </summary>
        /// <param name="requiredParams">The required parameters for the client.</param>
        /// <param name="primaryCtorOrderedParams">The ordered parameters for the primary constructor.</param>
        /// <param name="endpointParam">The endpoint parameter for the client.</param>
        private ConstructorProvider BuildSecondaryConstructor
            (List<ParameterProvider> requiredParams,
            List<ParameterProvider> primaryCtorOrderedParams,
            ParameterProvider? endpointParam)
        {
            var isEndpointRequired = endpointParam != null && endpointParam.DefaultValue == null;
            List<ParameterProvider> secondaryCtorParameters = isEndpointRequired ? [endpointParam, .. requiredParams] : requiredParams;

            // initialize the arguments for the primary constructor
            var primaryCtorArgs = new List<ValueExpression>(primaryCtorOrderedParams.Count);
            foreach (var p in primaryCtorOrderedParams)
            {
                if (p.DefaultValue == null && p.Validation != ParameterValidationType.None)
                {
                    primaryCtorArgs.Add(p);
                }
                else
                {
                    primaryCtorArgs.Add(p.DefaultValue ?? DefaultOf(p.Type));
                }
            }

            var primaryCtorInitializer = new ConstructorInitializer(false, primaryCtorArgs);
            var constructorSignature = new ConstructorSignature(
                Type,
                _publicCtorDescription,
                MethodSignatureModifiers.Public,
                secondaryCtorParameters,
                Initializer: primaryCtorInitializer);

            return new ConstructorProvider(
                constructorSignature,
                MethodBodyStatement.Empty,
                this);
        }

        private List<ParameterProvider> GetSubClientCtorParams()
        {
            var orderedParams = new List<ParameterProvider> { PipelineField.AsParameter };
            ParameterProvider? endpointParam = null;

            // add the auth parameter
            if (_apiKeyAuthParameter != null)
            {
                orderedParams.Add(_apiKeyAuthParameter);
            }

            // add the client parameters, except the endpoint parameter
            foreach (var parameter in _clientParameters)
            {
                if (parameter.Name == KnownParameters.Endpoint.Name)
                {
                    endpointParam = parameter;
                }
                else
                {
                    orderedParams.Add(parameter);
                }
            }

            // order the constructor parameters as (Pipeline, Auth, ClientParams, Endpoint).
            if (endpointParam != null)
            {
                orderedParams.Add(endpointParam);
            }

            return orderedParams;
        }

        private ConstructorProvider BuildMockingConstructor()
        {
            return new ConstructorProvider(
                new ConstructorSignature(Type, $"Initializes a new instance of {Name} for mocking.", MethodSignatureModifiers.Protected, []),
                new MethodBodyStatement[] { MethodBodyStatement.Empty },
                this);
        }

        private ConstructorProvider BuildSubClientInternalConstructor()
        {
            var parameters = GetSubClientCtorParams();
            MethodBodyStatement[] body = new MethodBodyStatement[parameters.Count];

            for (int i = 0; i < parameters.Count; i++)
            {
                body[i] = parameters[i].AsField.Assign(parameters[i]).Terminate();
            }

            return new ConstructorProvider(
                new ConstructorSignature(Type, _publicCtorDescription, MethodSignatureModifiers.Internal, parameters),
                body,
                this);
        }

        private FieldProvider? BuildAuthHeaderConstant()
        {
            if (_inputAuth?.ApiKey?.Name != null)
            {
                return new FieldProvider(
                    FieldModifiers.Private | FieldModifiers.Const,
                    typeof(string),
                    AuthorizationHeaderConstName,
                    initializationValue: Literal(_inputAuth.ApiKey.Name));
            }
            return null;
        }

        private FieldProvider? BuildAuthApiKeyPrefixConstant()
        {
            if (_inputAuth?.ApiKey?.Prefix != null)
            {
                return new FieldProvider(
                    FieldModifiers.Private | FieldModifiers.Const,
                    typeof(string),
                    AuthorizationApiKeyPrefixConstName,
                    initializationValue: Literal(_inputAuth.ApiKey.Prefix));
            }

            return null;
        }

        protected override MethodProvider[] BuildMethods()
        {
            List<MethodProvider> methods = new List<MethodProvider>();

            // Build methods for all the operations
            foreach (var operation in _inputClient.Operations)
            {
                var methodCollection = ClientModelPlugin.Instance.TypeFactory.CreateMethods(operation, this);
                if (methodCollection != null)
                {
                    methods.AddRange(methodCollection);
                }
            }

            return methods.ToArray();
        }

        private ParameterProvider[] GetClientParameters()
        {
            var parameterCount = _inputClient.Parameters.Count;
            ParameterProvider[] clientParameters = new ParameterProvider[parameterCount];

            for (var i = 0; i < parameterCount; i++)
            {
                var inputClientParam = _inputClient.Parameters[i];
                var parameterProvider = ClientModelPlugin.Instance.TypeFactory.CreateParameter(inputClientParam);
                if (inputClientParam.IsEndpoint)
                {
                    // add the endpoint parameter
                    var knownEndpointParam = KnownParameters.Endpoint;
                    var description = inputClientParam.Description ?? $"{knownEndpointParam.Description}";
                    var endpointValue = parameterProvider.DefaultValue != null
                        ? New.Instance(knownEndpointParam.Type, parameterProvider.DefaultValue)
                        : null;
                    var endpointParam = new ParameterProvider(
                        knownEndpointParam.Name,
                        $"{description}",
                        knownEndpointParam.Type,
                        defaultValue: endpointValue)
                    {
                        Validation = parameterProvider.Validation
                    };

                    clientParameters[i] = endpointParam;
                }
                else
                {
                    clientParameters[i] = parameterProvider;
                }
            }

            return clientParameters;
        }
    }
}
