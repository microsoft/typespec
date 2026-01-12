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
using Microsoft.TypeSpec.Generator.Utilities;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public class ClientOptionsProvider : TypeProvider
    {
        private const string VersionPropertyName = "Version";
        private readonly InputClient _inputClient;
        private readonly ClientProvider _clientProvider;
        private readonly List<TypeProvider>? _serviceVersionsEnums;
        private readonly List<PropertyProvider>? _versionProperties;
        private FieldProvider? _latestVersionField;
        private static ClientOptionsProvider? _singletonInstance;

        internal ClientOptionsProvider(InputClient inputClient, ClientProvider clientProvider)
        {
            _inputClient = inputClient;
            _clientProvider = clientProvider;
            List<InputEnumType> inputEnums = [.. ScmCodeModelGenerator.Instance.InputLibrary.InputNamespace.Enums
                    .Where(e => e.Usage.HasFlag(InputModelTypeUsage.ApiVersionEnum))];

            int enumCount = inputEnums.Count;
            if (enumCount > 0)
            {
                _serviceVersionsEnums = [];
                _versionProperties = [];
                foreach (var inputEnum in inputEnums)
                {
                    var enumProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateEnum(inputEnum, this);
                    if (enumProvider != null)
                    {
                        // Ensure the service version enum uses the same namespace as the options class since it is nested.
                        enumProvider.Update(@namespace: Type.Namespace);
                        _serviceVersionsEnums.Add(enumProvider);
                    }

                    var versionPropertyName = enumCount > 1
                        ? $"{inputEnum.Name.ToIdentifierName()}{VersionPropertyName}"
                        : VersionPropertyName;

                    _versionProperties.Add(new(
                        null,
                        MethodSignatureModifiers.Internal,
                        typeof(string),
                        versionPropertyName,
                        new AutoPropertyBody(false),
                        this));
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

        internal PropertyProvider? VersionProperty => _versionProperty;
        private List<FieldProvider>? LatestVersionsFields => field ??= BuildLatestVersionsFields();

        private List<FieldProvider>? BuildLatestVersionsFields()
        {
            if (_serviceVersionsEnums == null)
                return null;

            List<FieldProvider> latestVersionFields = new(_serviceVersionsEnums.Count);
            foreach (var enumProvider in _serviceVersionsEnums)
            {
                string fieldCandidateName = enumProvider.Name.ToIdentifierName();
                string fieldName = fieldCandidateName.ToLowerInvariant().EndsWith(VersionPropertyName.ToLowerInvariant())
                    ? fieldCandidateName
                    : $"{fieldCandidateName}{VersionPropertyName}";

                latestVersionFields.Add(new(
                    modifiers: FieldModifiers.Private | FieldModifiers.Const,
                    type: enumProvider.Type,
                    name: fieldName,
                    enclosingType: this,
                    initializationValue: Static(enumProvider.Type).Property(enumProvider.EnumValues[^1].Name)));
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
            if (LatestVersionsFields == null)
                return [];

            return [ .. LatestVersionsFields];
        }

        protected override TypeProvider[] BuildNestedTypes()
        {
            if (_serviceVersionsEnums == null)
                return [];

            return [.. _serviceVersionsEnums];
        }

        protected override ConstructorProvider[] BuildConstructors()
        {
            if (LatestVersionsFields == null)
                return [];

            foreach (var latestVersionField in LatestVersionsFields)
            {
                if (ScmCodeModelGenerator.Instance.TypeFactory.CSharpTypeMap.TryGetValue(latestVersionField.Type, out var provider)
                    && provider is EnumProvider serviceVersionEnum)
                {
                    var versionParam = new ParameterProvider(
                        "version",
                        $"The service version",
                        serviceVersionEnum.Type,
                        defaultValue: latestVersionField);
                    var serviceVersionsCount = serviceVersionEnum.EnumValues.Count;
                    List<SwitchCaseExpression> switchCases = new(serviceVersionsCount + 1);

                    for (int i = 0; i < serviceVersionsCount; i++)
                    {
                        var serviceVersionMember = serviceVersionEnum.EnumValues[i];
                        // ServiceVersion.Version => "version"
                        switchCases.Add(new(
                            Static(serviceVersionEnum.Type).Property(serviceVersionMember.Name),
                            new LiteralExpression(serviceVersionMember.Value)));
                    }

                    switchCases.Add(SwitchCaseExpression.Default(ThrowExpression(New.NotSupportedException(ValueExpression.Empty))));
                }
            }

            var constructor = new ConstructorProvider(
                new ConstructorSignature(Type, $"Initializes a new instance of {_clientProvider.Name}Options.", MethodSignatureModifiers.Public, [versionParam]),
                _versionProperty!.Assign(new SwitchExpression(versionParam, [.. switchCases])).Terminate(),
                this);
            return [constructor];
        }

        protected override PropertyProvider[] BuildProperties()
        {
            List<PropertyProvider> properties = _versionProperty != null ? [_versionProperty] : [];

            foreach (var p in _inputClient.Parameters)
            {
                if ((p is not InputEndpointParameter || p is InputEndpointParameter endpointParameter && !endpointParameter.IsEndpoint)
                    && !p.IsApiVersion && p.DefaultValue != null)
                {
                    FormattableString? description = null;
                    var parameterDescription = DocHelpers.GetDescription(p.Summary, p.Doc);
                    if (parameterDescription is not null)
                    {
                        description = $"{parameterDescription}";
                    }

                    var type = ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(p.Type)?.PropertyInitializationType;
                    if (type != null)
                    {
                        properties.Add(new(
                            description,
                            MethodSignatureModifiers.Public,
                            type,
                            p.Name.ToIdentifierName(),
                            new AutoPropertyBody(true),
                            this));
                    }
                }
            }

            return [.. properties];
        }
    }
}
