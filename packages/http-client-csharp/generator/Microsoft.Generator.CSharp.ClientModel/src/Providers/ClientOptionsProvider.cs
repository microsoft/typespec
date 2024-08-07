// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using static Microsoft.Generator.CSharp.Snippets.Snippet;
using System.ClientModel.Primitives;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal class ClientOptionsProvider : TypeProvider
    {
        private const string LatestVersionFieldName = "LatestVersion";
        private const string VersionPropertyName = "Version";
        private readonly InputClient _inputClient;
        private readonly ClientProvider _clientProvider;
        private readonly Lazy<TypeProvider?>? _serviceVersionEnum;
        private readonly PropertyProvider? _versionProperty;
        private FieldProvider? _latestVersionField;

        public ClientOptionsProvider(InputClient inputClient, ClientProvider clientProvider)
        {
            _inputClient = inputClient;
            _clientProvider = clientProvider;
            var inputEnumType = ClientModelPlugin.Instance.InputLibrary.InputNamespace.Enums
                    .FirstOrDefault(e => e.Usage.HasFlag(InputModelTypeUsage.ApiVersionEnum));
            if (inputEnumType != null)
            {
                _serviceVersionEnum = new(() => ClientModelPlugin.Instance.TypeFactory.CreateEnum(inputEnumType, this));
                _versionProperty = new(
                    null,
                    MethodSignatureModifiers.Internal,
                    typeof(string),
                    VersionPropertyName,
                    new AutoPropertyBody(false));
            }
        }

        private TypeProvider? ServiceVersionEnum => _serviceVersionEnum?.Value;
        private FieldProvider? LatestVersionField => _latestVersionField ??= BuildLatestVersionField();

        private FieldProvider? BuildLatestVersionField()
        {
            if (ServiceVersionEnum == null)
                return null;

            return new(
                modifiers: FieldModifiers.Private | FieldModifiers.Const,
                type: ServiceVersionEnum.Type,
                name: LatestVersionFieldName,
                initializationValue: Static(ServiceVersionEnum.Type).Property(ServiceVersionEnum.EnumValues[^1].Name));
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
            if (LatestVersionField == null)
                return [];

            return [LatestVersionField];
        }

        protected override TypeProvider[] BuildNestedTypes()
        {
            if (ServiceVersionEnum == null)
                return [];

            return [ServiceVersionEnum];
        }

        protected override ConstructorProvider[] BuildConstructors()
        {
            if (ServiceVersionEnum == null || LatestVersionField == null)
                return [];

            var versionParam = new ParameterProvider(
                "version",
                $"The service version",
                ServiceVersionEnum.Type,
                defaultValue: LatestVersionField);
            var serviceVersionsCount = ServiceVersionEnum.EnumValues.Count;
            List<SwitchCaseExpression> switchCases = new(serviceVersionsCount + 1);

            for (int i = 0; i < serviceVersionsCount; i++)
            {
                var serviceVersionMember = ServiceVersionEnum.EnumValues[i];
                // ServiceVersion.Version => "version"
                switchCases.Add(new(
                    Static(ServiceVersionEnum.Type).Property(serviceVersionMember.Name),
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

                    var type = ClientModelPlugin.Instance.TypeFactory.CreateCSharpType(p.Type)?.PropertyInitializationType;
                    if (type != null)
                    {
                        properties.Add(new(
                            description,
                            MethodSignatureModifiers.Public,
                            type,
                            p.Name.ToCleanName(),
                            new AutoPropertyBody(true)));
                    }
                }
            }

            return [.. properties];
        }
    }
}
