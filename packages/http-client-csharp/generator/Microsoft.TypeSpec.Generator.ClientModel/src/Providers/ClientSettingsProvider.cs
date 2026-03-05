// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Linq;
using Microsoft.Extensions.Configuration;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public class ClientSettingsProvider : TypeProvider
    {
        internal const string ClientSettingsDiagnosticId = "SCME0002";

        private readonly ClientProvider _clientProvider;
        private readonly InputEndpointParameter? _inputEndpointParam;

#pragma warning disable SCME0002 // ClientSettings is for evaluation purposes only
        internal static readonly CSharpType ClientSettingsType = typeof(ClientSettings);
#pragma warning restore SCME0002

        internal static readonly CSharpType IConfigurationSectionType = typeof(IConfigurationSection);

        internal ClientSettingsProvider(InputClient inputClient, ClientProvider clientProvider)
        {
            _clientProvider = clientProvider;
            _inputEndpointParam = inputClient.Parameters
                .FirstOrDefault(p => p is InputEndpointParameter ep && ep.IsEndpoint) as InputEndpointParameter;
        }

        internal string? EndpointPropertyName => _inputEndpointParam?.Name.ToIdentifierName();

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", $"{Name}.cs");

        protected override string BuildName() => $"{_clientProvider.Name}Settings";

        protected override string BuildNamespace() => _clientProvider.Type.Namespace;

        protected override CSharpType BuildBaseType() => ClientSettingsType;

        protected override IReadOnlyList<MethodBodyStatement> BuildAttributes()
        {
            return [new AttributeStatement(typeof(ExperimentalAttribute), Literal(ClientSettingsDiagnosticId))];
        }

        protected override PropertyProvider[] BuildProperties()
        {
            var properties = new List<PropertyProvider>();

            if (_inputEndpointParam != null)
            {
                properties.Add(new PropertyProvider(
                    null,
                    MethodSignatureModifiers.Public,
                    new CSharpType(typeof(Uri), isNullable: true),
                    EndpointPropertyName!,
                    new AutoPropertyBody(true),
                    this));
            }

            if (_clientProvider.ClientOptions != null)
            {
                properties.Add(new PropertyProvider(
                    null,
                    MethodSignatureModifiers.Public,
                    _clientProvider.ClientOptions.Type.WithNullable(true),
                    "Options",
                    new AutoPropertyBody(true),
                    this));
            }

            return [.. properties];
        }

        protected override MethodProvider[] BuildMethods()
        {
            var sectionParam = new ParameterProvider("section", $"The configuration section.", IConfigurationSectionType);
            var body = new List<MethodBodyStatement>();

            if (_inputEndpointParam != null)
            {
                var endpointPropertyName = EndpointPropertyName!;

                // string? endpoint = section["EndpointPropertyName"];
                var endpointVar = new VariableExpression(new CSharpType(typeof(string), isNullable: true), "endpoint");
                body.Add(Declare(endpointVar, new IndexerExpression(sectionParam, Literal(endpointPropertyName))));

                // if (!string.IsNullOrEmpty(endpoint)) { EndpointProperty = new Uri(endpoint); }
                var ifStatement = new IfStatement(Not(Static(typeof(string)).Invoke("IsNullOrEmpty", endpointVar)));
                ifStatement.Add(This.Property(endpointPropertyName).Assign(New.Instance(typeof(Uri), endpointVar)).Terminate());
                body.Add(ifStatement);
            }

            if (_clientProvider.ClientOptions != null)
            {
                // IConfigurationSection optionsSection = section.GetSection("Options");
                var optionsSectionVar = new VariableExpression(IConfigurationSectionType, "optionsSection");
                body.Add(Declare(optionsSectionVar, sectionParam.Invoke("GetSection", Literal("Options"))));

                // if (optionsSection.Exists()) { Options = new ClientOptions(optionsSection); }
                var ifOptionsStatement = new IfStatement(optionsSectionVar.Invoke("Exists"));
                ifOptionsStatement.Add(This.Property("Options").Assign(
                    New.Instance(_clientProvider.ClientOptions.Type, optionsSectionVar)).Terminate());
                body.Add(ifOptionsStatement);
            }

            var bindCoreMethod = new MethodProvider(
                new MethodSignature(
                    "BindCore",
                    $"Binds configuration values from the given section.",
                    MethodSignatureModifiers.Protected | MethodSignatureModifiers.Override,
                    null,
                    null,
                    [sectionParam]),
                new MethodBodyStatements([.. body]),
                this);

            return [bindCoreMethod];
        }
    }
}
