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
            => $"Represents the settings used to configure a <see cref=\"{_clientProvider.Name}\"/> that can be loaded from an <see cref=\"IConfigurationSection\"/>.";

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

                // Handle non-framework types (enums)
                if (!param.Type.IsFrameworkType)
                {
                    if (param.Type.IsEnum)
                    {
                        if (param.Type.IsStruct)
                        {
                            // Extensible enum (readonly struct): if (section["Name"] is string val) { Name = new TypeName(val); }
                            AppendEnumBinding(body, sectionParam, propName, param);
                        }
                        else
                        {
                            // Fixed enum: if (Enum.TryParse<TypeName>(section["Name"], out TypeName val)) { Name = val; }
                            AppendFixedEnumBinding(body, sectionParam, propName, param);
                        }
                    }
                    else
                    {
                        // Complex object: section.GetSection(name) + .Exists() + new Type(section)
                        AppendComplexObjectBinding(body, sectionParam, propName, param);
                    }
                    continue;
                }

                // Handle collection types (string[]/List<string>)
                if (param.Type.IsList)
                {
                    AppendStringListBinding(body, sectionParam, propName, param);
                    continue;
                }

                var frameworkType = param.Type.FrameworkType;

                // For string types: if (!string.IsNullOrEmpty(val)) PropName = val;
                if (frameworkType == typeof(string))
                {
                    var valVar = new VariableExpression(new CSharpType(typeof(string), isNullable: true), param.Name.ToVariableName());
                    body.Add(Declare(valVar, new IndexerExpression(sectionParam, Literal(propName))));
                    var ifStatement = new IfStatement(Not(StringSnippets.IsNullOrEmpty(valVar.As<string>())));
                    ifStatement.Add(This.Property(propName).Assign(valVar).Terminate());
                    body.Add(ifStatement);
                }
                // For bool: if (bool.TryParse(section[name], out bool val)) PropName = val;
                else if (frameworkType == typeof(bool))
                {
                    AppendTryParseBinding(body, sectionParam, propName, param, typeof(bool));
                }
                // For int: if (int.TryParse(section[name], out int val)) PropName = val;
                else if (frameworkType == typeof(int))
                {
                    AppendTryParseBinding(body, sectionParam, propName, param, typeof(int));
                }
                // For TimeSpan: if (TimeSpan.TryParse(section[name], out TimeSpan val)) PropName = val;
                else if (frameworkType == typeof(TimeSpan))
                {
                    AppendTryParseBinding(body, sectionParam, propName, param, typeof(TimeSpan));
                }
                // For Uri: if (Uri.TryCreate(section[name], UriKind.Absolute, out Uri val)) PropName = val;
                else if (frameworkType == typeof(Uri))
                {
                    AppendUriTryCreateBinding(body, sectionParam, propName, param);
                }
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

        /// <summary>
        /// Appends a TryParse-based binding statement: if (Type.TryParse(section[name], out Type val)) PropName = val;
        /// </summary>
        private static void AppendTryParseBinding(
            List<MethodBodyStatement> body,
            ParameterProvider sectionParam,
            string propName,
            ParameterProvider param,
            Type parseType)
        {
            var outDecl = new DeclarationExpression(parseType, param.Name.ToVariableName(), out var parsedVar, isOut: true);
            var ifStatement = new IfStatement(Static(parseType).Invoke("TryParse",
                new ValueExpression[]
                {
                    new IndexerExpression(sectionParam, Literal(propName)),
                    outDecl
                }));
            ifStatement.Add(This.Property(propName).Assign(parsedVar).Terminate());
            body.Add(ifStatement);
        }

        /// <summary>
        /// Appends a Uri.TryCreate binding: if (Uri.TryCreate(section[name], UriKind.Absolute, out Uri val)) PropName = val;
        /// </summary>
        private static void AppendUriTryCreateBinding(
            List<MethodBodyStatement> body,
            ParameterProvider sectionParam,
            string propName,
            ParameterProvider param)
        {
            var outUriDecl = new DeclarationExpression(typeof(Uri), param.Name.ToVariableName(), out var uriVar, isOut: true);
            var ifStatement = new IfStatement(Static(typeof(Uri)).Invoke("TryCreate",
                new ValueExpression[]
                {
                    new IndexerExpression(sectionParam, Literal(propName)),
                    new MemberExpression(typeof(UriKind), nameof(UriKind.Absolute)),
                    outUriDecl
                }));
            ifStatement.Add(This.Property(propName).Assign(uriVar).Terminate());
            body.Add(ifStatement);
        }

        /// <summary>
        /// Appends a string list binding: IConfigurationSection s = section.GetSection(name);
        /// if (s.Exists()) { PropName = s.GetChildren().Where(c => c.Value is not null).Select(c => c.Value!).ToList(); }
        /// </summary>
        private static void AppendStringListBinding(
            List<MethodBodyStatement> body,
            ParameterProvider sectionParam,
            string propName,
            ParameterProvider param)
        {
            // Only handle List<string> for now
            if (param.Type.Arguments.Count == 0 ||
                !param.Type.Arguments[0].IsFrameworkType ||
                param.Type.Arguments[0].FrameworkType != typeof(string))
            {
                return;
            }

            // IConfigurationSection listSection = section.GetSection("PropName");
            var sectionVar = new VariableExpression(IConfigurationSectionType, param.Name.ToVariableName() + "Section");
            body.Add(Declare(sectionVar, sectionParam.Invoke("GetSection", Literal(propName))));

            // if (listSection.Exists())
            var ifExistsStatement = new IfStatement(sectionVar.Invoke("Exists"));

            // listSection.GetChildren().Where(c => c.Value is not null).Select(c => c.Value!).ToList()
            var cDecl = new CodeWriterDeclaration("c");
            var cVar = new VariableExpression(IConfigurationSectionType, cDecl);
            var whereCondition = new BinaryOperatorExpression("is not", cVar.Property("Value"), Null);
            var whereLambda = new FuncExpression([cDecl], whereCondition);
            var whereResult = sectionVar.Invoke("GetChildren")
                .Invoke("Where", [whereLambda], null, false, extensionType: typeof(Enumerable));

            var c2Decl = new CodeWriterDeclaration("c");
            var c2Var = new VariableExpression(IConfigurationSectionType, c2Decl);
            var selectBody = new UnaryOperatorExpression("!", c2Var.Property("Value"), true);
            var selectLambda = new FuncExpression([c2Decl], selectBody);
            var selectResult = whereResult
                .Invoke("Select", [selectLambda], null, false, extensionType: typeof(Enumerable));

            var toListResult = selectResult.ToList();

            ifExistsStatement.Add(This.Property(propName).Assign(toListResult).Terminate());
            body.Add(ifExistsStatement);
        }

        /// <summary>
        /// Appends an extensible enum binding: if (section[name] is string val) { PropName = new TypeName(val); }
        /// </summary>
        private static void AppendEnumBinding(
            List<MethodBodyStatement> body,
            ParameterProvider sectionParam,
            string propName,
            ParameterProvider param)
        {
            var decl = new DeclarationExpression(typeof(string), param.Name.ToVariableName(), out var declVar);
            var isPattern = new BinaryOperatorExpression("is",
                new IndexerExpression(sectionParam, Literal(propName)),
                decl);
            var ifStatement = new IfStatement(isPattern);
            ifStatement.Add(This.Property(propName).Assign(New.Instance(param.Type, declVar)).Terminate());
            body.Add(ifStatement);
        }

        /// <summary>
        /// Appends a fixed enum binding: if (Enum.TryParse(section[name], out TypeName val)) { PropName = val; }
        /// </summary>
        private static void AppendFixedEnumBinding(
            List<MethodBodyStatement> body,
            ParameterProvider sectionParam,
            string propName,
            ParameterProvider param)
        {
            var outDecl = new DeclarationExpression(param.Type, param.Name.ToVariableName(), out var parsedVar, isOut: true);
            var ifStatement = new IfStatement(Static(typeof(Enum)).Invoke("TryParse",
                new ValueExpression[]
                {
                    new IndexerExpression(sectionParam, Literal(propName)),
                    outDecl
                }));
            ifStatement.Add(This.Property(propName).Assign(parsedVar).Terminate());
            body.Add(ifStatement);
        }

        /// <summary>
        /// Appends a complex object binding: IConfigurationSection s = section.GetSection(name);
        /// if (s.Exists()) { PropName = new TypeName(s); }
        /// </summary>
        private static void AppendComplexObjectBinding(
            List<MethodBodyStatement> body,
            ParameterProvider sectionParam,
            string propName,
            ParameterProvider param)
        {
            // IConfigurationSection {name}Section = section.GetSection("PropName");
            var sectionVar = new VariableExpression(IConfigurationSectionType, param.Name.ToVariableName() + "Section");
            body.Add(Declare(sectionVar, sectionParam.Invoke("GetSection", Literal(propName))));

            // if ({name}Section.Exists()) { PropName = new TypeName({name}Section); }
            var ifExistsStatement = new IfStatement(sectionVar.Invoke("Exists"));
            ifExistsStatement.Add(This.Property(propName).Assign(New.Instance(param.Type, sectionVar)).Terminate());
            body.Add(ifExistsStatement);
        }
    }
}
