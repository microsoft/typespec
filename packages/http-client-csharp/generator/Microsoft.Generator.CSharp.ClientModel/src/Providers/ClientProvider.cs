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
        private const string PipelineFieldName = "_pipeline";
        private const string ApiKeyCredentialFieldName = "_keyCredential";
        private const string EndpointFieldName = "_endpoint";
        private readonly FormattableString _publicCtorDescription;
        private readonly TypeProvider _clientOptions;
        private readonly InputClient _inputClient;
        private readonly InputAuth? _inputAuth;
        private readonly ParameterProvider _clientOptionsParameter;
        private readonly ParameterProvider _endpointParameter;
        private readonly FieldProvider _endpointField;
        private readonly FieldProvider? _apiKeyAuthField;
        private readonly FieldProvider? _authorizationHeaderConstant;
        private readonly FieldProvider? _authorizationApiKeyPrefixConstant;

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
            _endpointField = new(
                FieldModifiers.Private | FieldModifiers.ReadOnly,
                KnownParameters.Endpoint.Type,
                EndpointFieldName);

            _endpointParameter = BuildClientEndpointParameter();
            _publicCtorDescription = $"Initializes a new instance of {Name}.";
            PipelineField = new FieldProvider(FieldModifiers.Private | FieldModifiers.ReadOnly, typeof(ClientPipeline), PipelineFieldName);
        }

        public FieldProvider PipelineField { get; }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", $"{Name}.cs");

        protected override string BuildName() => _inputClient.Name.ToCleanName();

        protected override FieldProvider[] BuildFields()
        {
            List<FieldProvider> fields = [PipelineField, _endpointField];

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

        protected override ConstructorProvider[] BuildConstructors()
        {
            var primaryConstructorParameters = GetPrimaryConstructorParameters();
            var primaryConstructor = new ConstructorProvider(
                new ConstructorSignature(Type, _publicCtorDescription, MethodSignatureModifiers.Public, primaryConstructorParameters),
                BuildPrimaryConstructorBody(primaryConstructorParameters),
                this);

            var isEndpointRequired = _endpointParameter.InitializationValue == null;
            List<ParameterProvider> requiredParameters = isEndpointRequired ? [_endpointParameter] : [];
            if (_apiKeyAuthField != null)
            {
                requiredParameters.Add(_apiKeyAuthField.AsParameter);
            }

            var secondaryConstructor = BuildSecondaryConstructor(requiredParameters, primaryConstructorParameters);
            return requiredParameters.Count > 0 || _apiKeyAuthField != null
                ? [ConstructorProviderHelper.BuildMockingConstructor(this), secondaryConstructor, primaryConstructor]
                : [secondaryConstructor, primaryConstructor];
        }

        private MethodBodyStatement[] BuildPrimaryConstructorBody(IReadOnlyList<ParameterProvider> primaryConstructorParameters)
        {
            // add client options and endpoint initialization
            var clientOptionsInitializationValue = _clientOptionsParameter.InitializationValue ?? New.Instance(_clientOptions.Type.WithNullable(true));
            var clientOptionsAssignment = _clientOptionsParameter.Assign(clientOptionsInitializationValue, nullCoalesce: true).Terminate();
            var endpointAssignment = _endpointField.Assign(_endpointParameter).Terminate();
            List<MethodBodyStatement> body = [clientOptionsAssignment, MethodBodyStatement.EmptyLine, endpointAssignment];

            // add other parameter assignments to their corresponding fields
            foreach (var p in primaryConstructorParameters)
            {
                if (p.Field != null)
                {
                    body.Add(p.Field.Assign(p).Terminate());
                }
            }

            // handle pipeline field
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

            body.Add(PipelineField.Assign(ClientPipelineSnippets.Create(
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
            // initialize the arguments for the primary constructor
            var primaryCtorInitializer = new ConstructorInitializer(
                false,
                [.. primaryCtorOrderedParams.Select(p => p.InitializationValue ?? (p.Validation != ParameterValidationType.None ? p : DefaultOf(p.Type)))
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

        private ParameterProvider[] GetPrimaryConstructorParameters()
        {
            if (_apiKeyAuthField != null)
            {
                return [_endpointParameter, _apiKeyAuthField.AsParameter, _clientOptionsParameter];
            }

            return [_endpointParameter, _clientOptionsParameter];
        }

        private ParameterProvider BuildClientEndpointParameter()
        {
            for (var i = 0; i < _inputClient.Parameters.Count; i++)
            {
                var inputClientParam = _inputClient.Parameters[i];
                if (inputClientParam.IsEndpoint)
                {
                    var parameterProvider = new ParameterProvider(inputClientParam);
                    var knownEndpointParam = KnownParameters.Endpoint;
                    var description = inputClientParam.Description ?? $"{knownEndpointParam.Description}";
                    var initializationValue = GetParameterInitializationValue(inputClientParam);
                    var endpointValue = initializationValue != null ? New.Instance(knownEndpointParam.Type, initializationValue) : null;

                    return new(
                        knownEndpointParam.Name,
                        $"{description}",
                        knownEndpointParam.Type,
                        initializationValue: endpointValue)
                    {
                        Validation = parameterProvider.Validation
                    };
                }
            }

            return KnownParameters.Endpoint;
        }

        private static ValueExpression? GetParameterInitializationValue(InputParameter inputParameter)
        {
            if (inputParameter.DefaultValue is null)
            {
                return null;
            }

            var defaultValue = inputParameter.DefaultValue.Value;
            CSharpType valueType = ClientModelPlugin.Instance.TypeFactory.CreateCSharpType(inputParameter.DefaultValue.Type);

            if (valueType.IsFrameworkType && defaultValue is IConvertible)
            {
                var normalizedValue = Convert.ChangeType(defaultValue, valueType.FrameworkType);
                return Literal(normalizedValue);
            }

            return null;
        }
    }
}
