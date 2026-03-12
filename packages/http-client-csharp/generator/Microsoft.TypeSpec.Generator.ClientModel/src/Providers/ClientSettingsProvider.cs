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
                AppendUriTryCreateBinding(body, sectionParam, EndpointPropertyName, EndpointPropertyName.ToVariableName());
            }

            foreach (var param in OtherRequiredParams)
            {
                var propName = param.Name.ToIdentifierName();
                AppendBindingForProperty(body, sectionParam, propName, param.Name.ToVariableName(), param.Type);
            }

            if (_clientProvider.ClientOptions != null)
            {
                AppendComplexObjectBinding(body, sectionParam, "Options", "options", _clientProvider.ClientOptions.Type);
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
        /// Dispatches to the appropriate binding method based on the property type.
        /// </summary>
        internal static void AppendBindingForProperty(
            List<MethodBodyStatement> body,
            ParameterProvider sectionParam,
            string propName,
            string varName,
            CSharpType type)
        {
            // Handle non-framework types (enums, complex objects)
            if (!type.IsFrameworkType)
            {
                if (type.IsEnum)
                {
                    if (type.IsStruct)
                    {
                        AppendEnumBinding(body, sectionParam, propName, varName, type);
                    }
                    else
                    {
                        AppendFixedEnumBinding(body, sectionParam, propName, varName, type);
                    }
                }
                else
                {
                    AppendComplexObjectBinding(body, sectionParam, propName, varName, type);
                }
                return;
            }

            // Handle collection types (string[]/List<string>)
            if (type.IsList)
            {
                AppendStringListBinding(body, sectionParam, propName, varName, type);
                return;
            }

            var frameworkType = type.FrameworkType;

            if (frameworkType == typeof(string))
            {
                AppendStringBinding(body, sectionParam, propName, varName);
            }
            else if (frameworkType == typeof(bool))
            {
                AppendTryParseBinding(body, sectionParam, propName, varName, typeof(bool));
            }
            else if (frameworkType == typeof(int))
            {
                AppendTryParseBinding(body, sectionParam, propName, varName, typeof(int));
            }
            else if (frameworkType == typeof(long))
            {
                AppendTryParseBinding(body, sectionParam, propName, varName, typeof(long));
            }
            else if (frameworkType == typeof(float))
            {
                AppendTryParseBinding(body, sectionParam, propName, varName, typeof(float));
            }
            else if (frameworkType == typeof(double))
            {
                AppendTryParseBinding(body, sectionParam, propName, varName, typeof(double));
            }
            else if (frameworkType == typeof(TimeSpan))
            {
                AppendTryParseBinding(body, sectionParam, propName, varName, typeof(TimeSpan));
            }
            else if (frameworkType == typeof(Uri))
            {
                AppendUriTryCreateBinding(body, sectionParam, propName, varName);
            }
            else
            {
                AppendComplexObjectBinding(body, sectionParam, propName, varName, type);
            }
        }

        /// <summary>
        /// Appends a string binding: string? val = section[name]; if (!string.IsNullOrEmpty(val)) PropName = val;
        /// </summary>
        internal static void AppendStringBinding(
            List<MethodBodyStatement> body,
            ParameterProvider sectionParam,
            string propName,
            string varName)
        {
            body.Add(Declare(varName, new CSharpType(typeof(string), isNullable: true), new IndexerExpression(sectionParam, Literal(propName)), out var valVar));
            var ifStatement = new IfStatement(Not(StringSnippets.IsNullOrEmpty(valVar.As<string>())));
            ifStatement.Add(This.Property(propName).Assign(valVar).Terminate());
            body.Add(ifStatement);
        }

        /// <summary>
        /// Appends a TryParse-based binding statement: if (Type.TryParse(section[name], out Type val)) PropName = val;
        /// </summary>
        internal static void AppendTryParseBinding(
            List<MethodBodyStatement> body,
            ParameterProvider sectionParam,
            string propName,
            string varName,
            Type parseType)
        {
            var outDecl = new DeclarationExpression(parseType, varName, out var parsedVar, isOut: true);
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
        internal static void AppendUriTryCreateBinding(
            List<MethodBodyStatement> body,
            ParameterProvider sectionParam,
            string propName,
            string varName)
        {
            var outUriDecl = new DeclarationExpression(typeof(Uri), varName, out var uriVar, isOut: true);
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
        internal static void AppendStringListBinding(
            List<MethodBodyStatement> body,
            ParameterProvider sectionParam,
            string propName,
            string varName,
            CSharpType type)
        {
            // Only handle List<string> for now
            if (type.Arguments.Count == 0 ||
                !type.Arguments[0].IsFrameworkType ||
                type.Arguments[0].FrameworkType != typeof(string))
            {
                return;
            }

            // IConfigurationSection listSection = section.GetSection("PropName");
            body.Add(Declare((propName + "Section").ToVariableName(), IConfigurationSectionType, sectionParam.Invoke("GetSection", Literal(propName)), out var sectionVar));

            // if (listSection.Exists())
            var ifExistsStatement = new IfStatement(sectionVar.Invoke("Exists"));

            // listSection.GetChildren().Where(c => c.Value is not null).Select(c => c.Value!).ToList()
            var cWhereVar = new VariableExpression(IConfigurationSectionType, "c");
            var whereCondition = cWhereVar.Property("Value").IsNot(Null);
            var whereLambda = new FuncExpression([cWhereVar.Declaration], whereCondition);
            var whereResult = sectionVar.Invoke("GetChildren")
                .Invoke("Where", [whereLambda], null, false, extensionType: typeof(Enumerable));

            var cSelectVar = new VariableExpression(IConfigurationSectionType, "c");
            var selectBody = new UnaryOperatorExpression("!", cSelectVar.Property("Value"), true);
            var selectLambda = new FuncExpression([cSelectVar.Declaration], selectBody);
            var selectResult = whereResult
                .Invoke("Select", [selectLambda], null, false, extensionType: typeof(Enumerable));

            var toListResult = selectResult.ToList();

            ifExistsStatement.Add(This.Property(propName).Assign(toListResult).Terminate());
            body.Add(ifExistsStatement);
        }

        /// <summary>
        /// Appends an extensible enum binding: if (section[name] is string val) { PropName = new TypeName(val); }
        /// </summary>
        internal static void AppendEnumBinding(
            List<MethodBodyStatement> body,
            ParameterProvider sectionParam,
            string propName,
            string varName,
            CSharpType type)
        {
            var decl = Declare(varName, new CSharpType(typeof(string)), out var declVar);
            var ifStatement = new IfStatement(new IndexerExpression(sectionParam, Literal(propName)).Is(decl));
            ifStatement.Add(This.Property(propName).Assign(New.Instance(type, declVar)).Terminate());
            body.Add(ifStatement);
        }

        /// <summary>
        /// Appends a fixed enum binding: if (Enum.TryParse(section[name], out TypeName val)) { PropName = val; }
        /// </summary>
        internal static void AppendFixedEnumBinding(
            List<MethodBodyStatement> body,
            ParameterProvider sectionParam,
            string propName,
            string varName,
            CSharpType type)
        {
            var outDecl = new DeclarationExpression(type, varName, out var parsedVar, isOut: true);
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
        internal static void AppendComplexObjectBinding(
            List<MethodBodyStatement> body,
            ParameterProvider sectionParam,
            string propName,
            string varName,
            CSharpType type)
        {
            // IConfigurationSection {name}Section = section.GetSection("PropName");
            body.Add(Declare((propName + "Section").ToVariableName(), IConfigurationSectionType, sectionParam.Invoke("GetSection", Literal(propName)), out var sectionVar));

            // if ({name}Section.Exists()) { PropName = new TypeName({name}Section); }
            var ifExistsStatement = new IfStatement(sectionVar.Invoke("Exists"));
            ifExistsStatement.Add(This.Property(propName).Assign(New.Instance(type, sectionVar)).Terminate());
            body.Add(ifExistsStatement);
        }
    }
}
