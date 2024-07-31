// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;
using System.IO;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Primitives;
using System.ClientModel.Primitives;
using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using static Microsoft.Generator.CSharp.Snippets.Snippet;
using System.Linq;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal class ClientOptionsProvider : TypeProvider
    {
        private const string LatestVersionFieldName = "LatestVersion";
        private const string VersionPropertyName = "Version";
        private readonly InputClient _inputClient;
        private readonly ClientProvider _clientProvider;
        private readonly TypeProvider? _serviceVersionEnum;
        private readonly FieldProvider? _latestVersionField;
        private readonly PropertyProvider? _versionProperty;

        public ClientOptionsProvider(InputClient inputClient)
        {
            _inputClient = inputClient;
            _clientProvider = ClientModelPlugin.Instance.TypeFactory.CreateClient(inputClient);

            var inputEnumType = ClientModelPlugin.Instance.InputLibrary.InputNamespace.Enums
                    .FirstOrDefault(e => e.Usage.HasFlag(InputModelTypeUsage.ApiVersionEnum));
            if (inputEnumType != null)
            {
                _serviceVersionEnum = ClientModelPlugin.Instance.TypeFactory.CreateEnum(inputEnumType, this);
                _latestVersionField = new(
                    modifiers: FieldModifiers.Private | FieldModifiers.Const,
                    type: _serviceVersionEnum.Type,
                    name: LatestVersionFieldName,
                    initializationValue: Static(_serviceVersionEnum.Type).Property(_serviceVersionEnum.EnumValues[^1].Name));
                _versionProperty = new(
                    null,
                    MethodSignatureModifiers.Internal,
                    typeof(string),
                    VersionPropertyName,
                    new AutoPropertyBody(false));
            }
        }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", $"{Name}.cs");
        protected override string BuildName() => $"{_clientProvider.Name}Options";
        protected override FormattableString Description => $"Client options for {_clientProvider.Type:C}.";

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
            if (_serviceVersionEnum == null)
                return [];

            return [_serviceVersionEnum];
        }

        protected override ConstructorProvider[] BuildConstructors()
        {
            if (_serviceVersionEnum == null || _latestVersionField == null)
                return [];

            var versionParam = new ParameterProvider(
                "version",
                $"The service version",
                _serviceVersionEnum.Type,
                defaultValue: _latestVersionField);
            var serviceVersionsCount = _serviceVersionEnum.EnumValues.Count;
            List<SwitchCaseExpression> switchCases = new(serviceVersionsCount + 1);

            for (int i = 0; i < serviceVersionsCount; i++)
            {
                var serviceVersionMember = _serviceVersionEnum.EnumValues[i];
                // ServiceVersion.Version => "version"
                switchCases.Add(new(
                    new MemberExpression(_serviceVersionEnum.Type, serviceVersionMember.Name),
                    new LiteralExpression(serviceVersionMember.Value)));
            }

            switchCases.Add(SwitchCaseExpression.Default(ThrowExpression(New.NotSupportedException(ValueExpression.Empty))));

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
                if (!p.IsEndpoint && p.DefaultValue != null)
                {
                    FormattableString? description = null;
                    if (p.Description != null)
                    {
                        description = $"{p.Description}";
                    }

                    properties.Add(new(
                        description,
                        MethodSignatureModifiers.Public,
                        ClientModelPlugin.Instance.TypeFactory.CreateCSharpType(p.Type).PropertyInitializationType,
                        p.Name.ToCleanName(),
                        new AutoPropertyBody(true)));
                }
            }

            return [.. properties];
        }
    }
}
