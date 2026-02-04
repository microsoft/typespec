// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Shared;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Utilities;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public class ClientOptionsProvider : TypeProvider
    {
        private const string ServicePrefix = "Service";
        private const string VersionSuffix = "Version";
        private const string ApiVersionSuffix = "ApiVersion";
        private const string LatestPrefix = "Latest";
        private const string LatestVersionFieldName = $"{LatestPrefix}{VersionSuffix}";

        private readonly InputClient _inputClient;
        private readonly ClientProvider _clientProvider;
        private readonly Dictionary<InputEnumType, EnumProvider>? _serviceVersionsEnums;
        private static ClientOptionsProvider? _singletonInstance;

        internal ClientOptionsProvider(InputClient inputClient, ClientProvider clientProvider)
        {
            _inputClient = inputClient;
            _clientProvider = clientProvider;
            List<InputEnumType> inputEnums = [.. ScmCodeModelGenerator.Instance.InputLibrary.InputNamespace.Enums
                    .Where(e => e.Usage.HasFlag(InputModelTypeUsage.ApiVersionEnum))];

            if (inputEnums.Count > 0)
            {
                _serviceVersionsEnums = [];
                foreach (var inputEnum in inputEnums)
                {
                    var enumProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateEnum(inputEnum, this);
                    if (enumProvider != null)
                    {
                        // Ensure the service version enum uses the same namespace as the options class since it is nested.
                        enumProvider.Update(@namespace: Type.Namespace);
                        _serviceVersionsEnums.Add(inputEnum, enumProvider);
                    }

                    // Only create one version property for single service clients
                    if (!_inputClient.IsMultiServiceClient)
                    {
                        break;
                    }
                }
            }
        }

        /// <summary>
        /// Factory method to create a ClientOptionsProvider instance.
        /// Returns a singleton instance when there are multiple root clients and the client has no custom parameters.
        /// Otherwise, creates a new instance specific to the client.
        /// </summary>
        /// <param name="inputClient">The input client.</param>
        /// <param name="clientProvider">The client provider.</param>
        /// <returns>A ClientOptionsProvider instance.</returns>
        public static ClientOptionsProvider CreateClientOptionsProvider(InputClient inputClient, ClientProvider clientProvider)
        {
            if (UseSingletonInstance(inputClient))
            {
                // Use singleton instance
                if (_singletonInstance == null)
                {
                    // Create singleton with namespace-based naming
                    _singletonInstance = new ClientOptionsProvider(inputClient, clientProvider);
                }
                return _singletonInstance;
            }

            // Create client-specific instance
            return new ClientOptionsProvider(inputClient, clientProvider);
        }

        /// <summary>
        /// Determines if a client has only standard parameters (ApiVersion and Endpoint).
        /// </summary>
        /// <param name="inputClient">The input client to check.</param>
        /// <returns>True if the client has only standard parameters, false otherwise.</returns>
        private static bool UseSingletonInstance(InputClient inputClient)
        {
            var rootClients = ScmCodeModelGenerator.Instance.InputLibrary.InputNamespace.RootClients;
            if (rootClients.Count <= 1)
            {
                // Only one root client, no need for singleton
                return false;
            }

            foreach (var parameter in inputClient.Parameters)
            {
                // Check if parameter is NOT an ApiVersion or Endpoint parameter
                if (!parameter.IsApiVersion)
                {
                    if (parameter is InputEndpointParameter endpointParam)
                    {
                        // Endpoint parameters are standard
                        if (!endpointParam.IsEndpoint)
                        {
                            return false; // Found a non-standard endpoint parameter
                        }
                    }
                    else
                    {
                        // Found a non-ApiVersion, non-Endpoint parameter
                        return false;
                    }
                }
            }
            return true;
        }

        internal IReadOnlyDictionary<EnumProvider, PropertyProvider>? VersionProperties => field ??= BuildVersionProperties();

        private Dictionary<EnumProvider, PropertyProvider>? BuildVersionProperties()
        {
            if (_serviceVersionsEnums is null)
            {
                return null;
            }

            var properties = new Dictionary<EnumProvider, PropertyProvider>(_serviceVersionsEnums.Count);
            foreach (var (inputEnum, enumProvider) in _serviceVersionsEnums)
            {
                var versionPropertyName = _inputClient.IsMultiServiceClient
                    ? ClientHelper.BuildNameForService(inputEnum.Namespace, ServicePrefix, ApiVersionSuffix)
                    : VersionSuffix;

                var versionProperty = new PropertyProvider(
                    null,
                    MethodSignatureModifiers.Internal,
                    typeof(string),
                    versionPropertyName,
                    new AutoPropertyBody(false),
                    this);
                properties.Add(enumProvider, versionProperty);
            }

            return properties;
        }
        private IReadOnlyDictionary<FieldProvider, EnumProvider>? LatestVersionsFields => field ??= BuildLatestVersionsFields();

        private Dictionary<FieldProvider, EnumProvider>? BuildLatestVersionsFields()
        {
            if (_serviceVersionsEnums is null)
            {
                return null;
            }

            Dictionary<FieldProvider, EnumProvider> latestVersionFields = new(_serviceVersionsEnums.Count);
            foreach (var enumProvider in _serviceVersionsEnums.Values)
            {
                var fieldName = _inputClient.IsMultiServiceClient
                    ? $"{LatestPrefix}{enumProvider.Name.ToIdentifierName()}"
                    : LatestVersionFieldName;
                var field = new FieldProvider(
                    modifiers: FieldModifiers.Private | FieldModifiers.Const,
                    type: enumProvider.Type,
                    name: fieldName,
                    enclosingType: this,
                    initializationValue: Static(enumProvider.Type).Property(enumProvider.EnumValues[^1].Name));

                latestVersionFields.Add(field, enumProvider);
            }

            return latestVersionFields;
        }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", $"{Name}.cs");

        protected override string BuildName()
        {
            if (UseSingletonInstance(_inputClient))
            {
                // Use namespace-based naming for singleton
                return $"{ScmCodeModelGenerator.Instance.TypeFactory.ServiceName}ClientOptions";
            }

            // Use client-specific naming
            return $"{_clientProvider.Name}Options";
        }

        protected override string BuildNamespace() => _clientProvider.Type.Namespace;

        protected override FormattableString BuildDescription()
        {
            if (this == _singletonInstance)
            {
                return $"Client options for clients in this library.";
            }

            return $"Client options for {_clientProvider.Type:C}.";
        }

        protected override CSharpType BuildBaseType()
        {
            return ScmCodeModelGenerator.Instance.TypeFactory.ClientPipelineApi.ClientPipelineOptionsType;
        }

        protected override FieldProvider[] BuildFields()
        {
            if (LatestVersionsFields is null)
            {
                return [];
            }

            return [.. LatestVersionsFields.Keys.OrderBy(f => f.Name)];
        }

        protected override TypeProvider[] BuildNestedTypes()
        {
            if (_serviceVersionsEnums is null)
            {
                return [];
            }

            return [.. _serviceVersionsEnums.Values.OrderBy(e => e.Name)];
        }

        protected override ConstructorProvider[] BuildConstructors()
        {
            if (LatestVersionsFields is null)
            {
                return [];
            }

            var constructorBody = new List<MethodBodyStatement>();
            var constructorParameters = new List<ParameterProvider>();
            foreach (var (latestVersionField, serviceVersionEnum) in LatestVersionsFields)
            {
                if (VersionProperties is null ||
                    !VersionProperties.TryGetValue(serviceVersionEnum, out PropertyProvider? versionProperty))
                {
                    continue;
                }

                string versionParameterName = "version";
                FormattableString versionParamDescription = $"The service version";
                if (_inputClient.IsMultiServiceClient)
                {
                    versionParameterName = ClientHelper.BuildNameForService(
                        serviceVersionEnum.Name,
                        ServicePrefix,
                        VersionSuffix).ToVariableName();
                    versionParamDescription = $"The {serviceVersionEnum.Name} service version";
                }

                var versionParam = new ParameterProvider(
                    versionParameterName,
                    versionParamDescription,
                    serviceVersionEnum.Type,
                    defaultValue: latestVersionField);
                constructorParameters.Add(versionParam);

                var enumValues = serviceVersionEnum.EnumValues;
                var switchCases = new List<SwitchCaseExpression>(enumValues.Count + 1);
                foreach (var serviceVersionMember in enumValues)
                {
                    // ServiceVersion.Version => "version"
                    switchCases.Add(new SwitchCaseExpression(
                        Static(serviceVersionEnum.Type).Property(serviceVersionMember.Name),
                        new LiteralExpression(serviceVersionMember.Value)));
                }

                switchCases.Add(SwitchCaseExpression.Default(ThrowExpression(New.NotSupportedException(ValueExpression.Empty))));
                constructorBody.Add(versionProperty.Assign(new SwitchExpression(versionParam, [.. switchCases])).Terminate());
            }

            var constructor = new ConstructorProvider(
                new ConstructorSignature(Type, $"Initializes a new instance of {_clientProvider.Name}Options.", MethodSignatureModifiers.Public, constructorParameters),
                constructorBody,
                this);
            return [constructor];
        }

        protected override PropertyProvider[] BuildProperties()
        {
            var properties = VersionProperties is not null
                ? [.. VersionProperties.Values.OrderBy(p => p.Name)]
                : new List<PropertyProvider>();

            foreach (var p in _inputClient.Parameters)
            {
                if ((p is not InputEndpointParameter || p is InputEndpointParameter endpointParameter && !endpointParameter.IsEndpoint)
                    && !p.IsApiVersion && p.DefaultValue != null)
                {
                    var type = ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(p.Type)?.PropertyInitializationType;
                    if (type is null)
                    {
                        continue;
                    }

                    FormattableString? description = null;
                    var parameterDescription = DocHelpers.GetDescription(p.Summary, p.Doc);
                    if (parameterDescription is not null)
                    {
                        description = $"{parameterDescription}";
                    }

                    properties.Add(new PropertyProvider(
                        description,
                        MethodSignatureModifiers.Public,
                        type,
                        p.Name.ToIdentifierName(),
                        new AutoPropertyBody(true),
                        this));
                }
            }

            return [.. properties];
        }
    }
}
