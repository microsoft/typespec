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
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public class ClientSettingsProvider : TypeProvider
    {
        internal const string ClientSettingsDiagnosticId = "SCME0002";

        private readonly ClientProvider _clientProvider;

#pragma warning disable SCME0002 // ClientSettings is for evaluation purposes only
        internal static readonly CSharpType ClientSettingsType = typeof(ClientSettings);
#pragma warning restore SCME0002

        internal static readonly CSharpType IConfigurationSectionType = typeof(IConfigurationSection);

        internal ClientSettingsProvider(InputClient inputClient, ClientProvider clientProvider)
        {
            _clientProvider = clientProvider;

            var inputEndpointParam = inputClient.Parameters
                .FirstOrDefault(p => p is InputEndpointParameter ep && ep.IsEndpoint) as InputEndpointParameter;
            EndpointPropertyName = inputEndpointParam?.Name.ToIdentifierName();

            // Collect non-endpoint, non-apiVersion required parameters (auth params come separately via InputClient.Auth)
            OtherRequiredParams = inputClient.Parameters
                .Where(p => p.IsRequired && !p.IsApiVersion &&
                            !(p is InputEndpointParameter ep && ep.IsEndpoint))
                .Select(p => ScmCodeModelGenerator.Instance.TypeFactory.CreateParameter(p))
                .Where(p => p != null)
                .Select(p => p!)
                .ToList();
        }

        internal string? EndpointPropertyName { get; }

        /// <summary>Gets non-endpoint, non-auth required parameters that have settings properties.</summary>
        internal IReadOnlyList<ParameterProvider> OtherRequiredParams { get; }

        protected override FormattableString BuildDescription()
            => $"Settings for the {_clientProvider.Name} client, extending <see cref=\"ClientSettings\"/>.";

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

            if (EndpointPropertyName != null)
            {
                properties.Add(new PropertyProvider(
                    null,
                    MethodSignatureModifiers.Public,
                    new CSharpType(typeof(Uri), isNullable: true),
                    EndpointPropertyName,
                    new AutoPropertyBody(true),
                    this));
            }

            foreach (var param in OtherRequiredParams)
            {
                properties.Add(new PropertyProvider(
                    null,
                    MethodSignatureModifiers.Public,
                    param.Type.WithNullable(true),
                    param.Name.ToIdentifierName(),
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

            if (EndpointPropertyName != null)
            {
                // if (Uri.TryCreate(section["EndpointPropertyName"], UriKind.Absolute, out Uri varName)) { EndpointProperty = varName; }
                var outUriDecl = new DeclarationExpression(typeof(Uri), EndpointPropertyName.ToVariableName(), out var uriVar, isOut: true);
                var ifStatement = new IfStatement(Static(typeof(Uri)).Invoke("TryCreate",
                    new ValueExpression[]
                    {
                        new IndexerExpression(sectionParam, Literal(EndpointPropertyName)),
                        new MemberExpression(typeof(UriKind), nameof(UriKind.Absolute)),
                        outUriDecl
                    }));
                ifStatement.Add(This.Property(EndpointPropertyName).Assign(uriVar).Terminate());
                body.Add(ifStatement);
            }

            foreach (var param in OtherRequiredParams)
            {
                var propName = param.Name.ToIdentifierName();
                // For string types: if (section[propName] is string val) PropName = val;
                if (param.Type.IsFrameworkType && param.Type.FrameworkType == typeof(string))
                {
                    var valVar = new VariableExpression(new CSharpType(typeof(string), isNullable: true), param.Name.ToVariableName());
                    body.Add(Declare(valVar, new IndexerExpression(sectionParam, Literal(propName))));
                    var ifStatement = new IfStatement(Not(StringSnippets.IsNullOrEmpty(valVar.As<string>())));
                    ifStatement.Add(This.Property(propName).Assign(valVar).Terminate());
                    body.Add(ifStatement);
                }
                // Other types are skipped in BindCore (users can customize via partial class)
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
