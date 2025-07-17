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
        private const string LatestVersionFieldName = "LatestVersion";
        private const string VersionPropertyName = "Version";
        private readonly InputClient _inputClient;
        private readonly ClientProvider _clientProvider;
        private readonly TypeProvider? _serviceVersionEnum;
        private readonly PropertyProvider? _versionProperty;
        private FieldProvider? _latestVersionField;

        public ClientOptionsProvider(InputClient inputClient, ClientProvider clientProvider)
        {
            _inputClient = inputClient;
            _clientProvider = clientProvider;
            var inputEnumType = ScmCodeModelGenerator.Instance.InputLibrary.InputNamespace.Enums
                    .FirstOrDefault(e => e.Usage.HasFlag(InputModelTypeUsage.ApiVersionEnum));
            if (inputEnumType != null)
            {
                _serviceVersionEnum = ScmCodeModelGenerator.Instance.TypeFactory.CreateEnum(inputEnumType, this);
                // Ensure the service version enum uses the same namespace as the options class since it is nested.
                _serviceVersionEnum?.Update(@namespace: Type.Namespace);
                _versionProperty = new(
                    null,
                    MethodSignatureModifiers.Internal,
                    typeof(string),
                    VersionPropertyName,
                    new AutoPropertyBody(false),
                    this);
            }
        }

        internal PropertyProvider? VersionProperty => _versionProperty;
        private FieldProvider? LatestVersionField => _latestVersionField ??= BuildLatestVersionField();

        private FieldProvider? BuildLatestVersionField()
        {
            if (_serviceVersionEnum == null)
                return null;

            return new(
                modifiers: FieldModifiers.Private | FieldModifiers.Const,
                type: _serviceVersionEnum.Type,
                name: LatestVersionFieldName,
                enclosingType: this,
                initializationValue: Static(_serviceVersionEnum.Type).Property(_serviceVersionEnum.EnumValues[^1].Name));
        }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", $"{Name}.cs");
        protected override string BuildName() => $"{_clientProvider.Name}Options";
        protected override string BuildNamespace() => _clientProvider.Type.Namespace;
        protected override FormattableString BuildDescription() => $"Client options for {_clientProvider.Type:C}.";

        protected override CSharpType[] BuildImplements()
        {
            return [ScmCodeModelGenerator.Instance.TypeFactory.ClientPipelineApi.ClientPipelineOptionsType];
        }

        protected override FieldProvider[] BuildFields()
        {
            if (LatestVersionField == null)
                return [];

            return [LatestVersionField];
        }

        protected override TypeProvider[] BuildNestedTypes()
        {
            if (_serviceVersionEnum == null)
                return [];

            return [_serviceVersionEnum];
        }

        protected override ConstructorProvider[] BuildConstructors()
        {
            if (_serviceVersionEnum == null || LatestVersionField == null)
                return [];

            var versionParam = new ParameterProvider(
                "version",
                $"The service version",
                _serviceVersionEnum.Type,
                defaultValue: LatestVersionField);
            var serviceVersionsCount = _serviceVersionEnum.EnumValues.Count;
            List<SwitchCaseExpression> switchCases = new(serviceVersionsCount + 1);

            for (int i = 0; i < serviceVersionsCount; i++)
            {
                var serviceVersionMember = _serviceVersionEnum.EnumValues[i];
                // ServiceVersion.Version => "version"
                switchCases.Add(new(
                    Static(_serviceVersionEnum.Type).Property(serviceVersionMember.Name),
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
                if (!p.IsEndpoint && !p.IsApiVersion && p.DefaultValue != null)
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
