// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;
using System.IO;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Primitives;
using System.ClientModel.Primitives;
using System;
using Microsoft.Generator.CSharp.ClientModel.Primitives;
using System.Collections.Generic;
using System.Globalization;
using System.Text;
using Microsoft.Generator.CSharp.Expressions;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal class ClientOptionsProvider : TypeProvider
    {
        private const string LatestVersionFieldName = "LatestVersion";
        private const string VersionPropertyName = "Version";
        private readonly InputClient _inputClient;
        private readonly ClientProvider _clientProvider;
        private readonly string _clientOptionsName;
        private readonly string _clientName;
        private readonly ServiceVersionDefinition? _serviceVersionDefinition;
        private readonly FieldProvider? _latestVersionField;
        private readonly PropertyProvider? _versionProperty;

        public ClientOptionsProvider(InputClient inputClient, ClientProvider clientProvider)
        {
            _inputClient = inputClient;
            _clientProvider = clientProvider;
            _clientName = _inputClient.Name.ToCleanName();
            _clientOptionsName = $"{_inputClient.Name}Options".ToCleanName();

            var inputApiVersions = ClientModelPlugin.Instance.InputLibrary.InputNamespace.ApiVersions;
            ApiVersions = ParseApiVersions(inputApiVersions);

            if (ApiVersions.Count > 0)
            {
                _serviceVersionDefinition = new ServiceVersionDefinition(this);
                _latestVersionField = new(
                    modifiers: FieldModifiers.Private | FieldModifiers.Const,
                    type: _serviceVersionDefinition.Type,
                    name: LatestVersionFieldName,
                    initializationValue: Static(_serviceVersionDefinition.Type).Property(_serviceVersionDefinition.LatestServiceVersion.Name));
                _versionProperty = new(
                    null,
                    MethodSignatureModifiers.Internal,
                    typeof(string),
                    VersionPropertyName,
                    new AutoPropertyBody(false));
            }
        }

        internal IReadOnlyList<ApiVersion> ApiVersions { get; }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", $"{Name}.cs");
        protected override string BuildName() => _clientOptionsName;
        protected override FormattableString Description => $"Client options for {_clientName}.";

        protected override CSharpType[] BuildImplements()
        {
            return [typeof(ClientPipelineOptions)];
        }

        protected override FieldProvider[] BuildFields()
        {
            if (_latestVersionField == null)
                return [];

            return [_latestVersionField];
        }

        protected override TypeProvider[] BuildNestedTypes()
        {
            if (_serviceVersionDefinition == null)
                return [];

            return [_serviceVersionDefinition];
        }

        protected override ConstructorProvider[] BuildConstructors()
        {
            if (_serviceVersionDefinition == null || _latestVersionField == null)
                return [];

            var versionParam = new ParameterProvider(
                "version",
                $"The service version",
                _serviceVersionDefinition.Type,
                defaultValue: _latestVersionField);
            var serviceVersionsCount = _serviceVersionDefinition.Members.Count;
            List<SwitchCaseExpression> switchCases = new(serviceVersionsCount + 1);

            for (int i = 0; i < serviceVersionsCount; i++)
            {
                var serviceVersionMember = _serviceVersionDefinition.Members[i];
                // ServiceVersion.Version => "version"
                switchCases.Add(new(
                    new MemberExpression(_serviceVersionDefinition.Type, serviceVersionMember.Name),
                    new LiteralExpression(serviceVersionMember.Value)));
            }

            switchCases.Add(SwitchCaseExpression.Default(ThrowExpression(New.NotSupportedException(ValueExpression.Empty))));

            var constructor = new ConstructorProvider(
                new ConstructorSignature(Type, $"Initializes a new instance of {_clientOptionsName}.", MethodSignatureModifiers.Public, [versionParam]),
                _versionProperty!.Assign(new SwitchExpression(versionParam, [.. switchCases])).Terminate(),
                this);
            return [constructor];
        }

        protected override PropertyProvider[] BuildProperties()
        {
            List<PropertyProvider> properties = _versionProperty != null ? [_versionProperty] : [];

            foreach (var f in _clientProvider.Fields)
            {
                if (f != _clientProvider.ApiKeyAuthField
                    && f != _clientProvider.EndpointField
                    && !f.Modifiers.HasFlag(FieldModifiers.Const))
                {
                    properties.Add(new(
                        f.Description,
                        MethodSignatureModifiers.Public,
                        f.Type.PropertyInitializationType,
                        f.Name.ToCleanName(),
                        new AutoPropertyBody(true),
                        backingField: f));
                }
            }

            return [.. properties];
        }

        private static ApiVersion[] ParseApiVersions(IReadOnlyList<string> inputApiVersions)
        {
            if (inputApiVersions == null)
            {
                return [];
            }

            var count = inputApiVersions.Count;
            var parsedVersions = new ApiVersion[count];

            for (int i = 0; i < count; i++)
            {
                var normalizedVersion = NormalizeVersion(inputApiVersions[i]);
                var description = $"Service version \"{inputApiVersions[i]}\"";
                parsedVersions[i] = new ApiVersion(normalizedVersion, description, i + 1, inputApiVersions[i]);
            }

            return parsedVersions;
        }

        internal static string NormalizeVersion(string version) =>
            CultureInfo.InvariantCulture.TextInfo.ToTitleCase(new StringBuilder("V")
                .Append(version.StartsWith("v", true, CultureInfo.InvariantCulture) ? version.Substring(1) : version)
                .Replace('-', '_')
                .Replace('.', '_')
                .ToString());
    }
}
