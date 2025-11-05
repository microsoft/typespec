// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    internal sealed class ClientUriBuilderDefinition : TypeProvider
    {
        private const string ToUriMethodName = "ToUri";
        private const string ResetMethodName = "Reset";
        private const string AppendQueryMethodName = "AppendQuery";
        private const string AppendQueryDelimitedMethodName = "AppendQueryDelimited";
        private const string AppendPathDelimitedMethodName = "AppendPathDelimited";
        private const string AppendPathMethodName = "AppendPath";

        private readonly FieldProvider _uriBuilderField;
        private readonly FieldProvider _pathAndQueryField;
        private readonly FieldProvider _pathLengthField;

        private PropertyProvider? _uriBuilderProperty;
        private PropertyProvider UriBuilderProperty => _uriBuilderProperty ??= new(
            modifiers: MethodSignatureModifiers.Private,
            name: "UriBuilder",
            type: typeof(UriBuilder),
            body: new ExpressionPropertyBody(new BinaryOperatorExpression(" ??= ", _uriBuilderField, New.Instance(typeof(UriBuilder)))),
            description: null,
            enclosingType: this);

        private ValueExpression UriBuilderPath => new MemberExpression(UriBuilderProperty, "Path");
        private ValueExpression UriBuilderQuery => new MemberExpression(UriBuilderProperty, "Query");

        private readonly ParameterProvider _formatParameter = new ParameterProvider(
            "format",
            $"The format.",
            ScmCodeModelGenerator.Instance.SerializationFormatDefinition.Type,
            new MemberExpression(ScmCodeModelGenerator.Instance.SerializationFormatDefinition.Type, "Default"));

        private PropertyProvider? _pathAndQueryProperty;
        private PropertyProvider PathAndQueryProperty => _pathAndQueryProperty ??= new(
            modifiers: MethodSignatureModifiers.Private,
            name: "PathAndQuery",
            type: typeof(StringBuilder),
            body: new ExpressionPropertyBody(new BinaryOperatorExpression(" ??= ", _pathAndQueryField, New.Instance(typeof(StringBuilder)))),
            description: null,
            enclosingType: this);

        public ClientUriBuilderDefinition()
        {
            _uriBuilderField = new(FieldModifiers.Private, typeof(UriBuilder), "_uriBuilder", this);
            _pathAndQueryField = new(FieldModifiers.Private, typeof(StringBuilder), "_pathAndQuery", this);
            _pathLengthField = new(FieldModifiers.Private, typeof(int), "_pathLength", this);
        }

        protected override TypeSignatureModifiers BuildDeclarationModifiers()
        {
            return TypeSignatureModifiers.Internal;
        }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override string BuildName() => "ClientUriBuilder";

        protected override FieldProvider[] BuildFields()
        {
            return [_uriBuilderField, _pathAndQueryField, _pathLengthField];
        }

        protected override PropertyProvider[] BuildProperties()
        {
            return [UriBuilderProperty, PathAndQueryProperty];
        }

        protected override ConstructorProvider[] BuildConstructors()
        {
            var signature = new ConstructorSignature(
                type: Type,
                modifiers: MethodSignatureModifiers.Public,
                parameters: Array.Empty<ParameterProvider>(),
                description: null);
            return [new ConstructorProvider(signature, MethodBodyStatement.Empty, this, XmlDocProvider.Empty)];
        }

        protected override MethodProvider[] BuildMethods()
        {
            var methods = new List<MethodProvider>();

            methods.Add(BuildResetMethod());
            methods.AddRange(BuildAppendPathMethods());
            methods.AddRange(BuildAppendPathDelimitedMethods());
            methods.AddRange(BuildAppendQueryMethods());
            methods.AddRange(BuildAppendQueryDelimitedMethods());
            methods.Add(BuildToUriMethod());

            return methods.ToArray();
        }

        private MethodProvider BuildResetMethod()
        {
            var uriParameter = new ParameterProvider("uri", $"The uri.", typeof(Uri));
            var signature = new MethodSignature(
                Name: ResetMethodName,
                Modifiers: MethodSignatureModifiers.Public,
                Parameters: new[]
                {
                    uriParameter
                },
                ReturnType: null,
                Description: null, ReturnDescription: null);

            var stringBuilder = PathAndQueryProperty.As<StringBuilder>();
            var body = new MethodBodyStatement[]
            {
                _uriBuilderField.Assign(New.Instance(_uriBuilderField.Type, uriParameter)).Terminate(),
                stringBuilder.Invoke("Clear").Terminate(),
                stringBuilder.Append(UriBuilderPath).Terminate(),
                _pathLengthField.Assign(stringBuilder.Length()).Terminate()
            };

            return new(signature, body, this, XmlDocProvider.Empty);
        }

        private MethodProvider[] BuildAppendPathMethods()
        {
            var valueParameter = new ParameterProvider("value", $"The value.", typeof(string));
            var escapeParameter = new ParameterProvider("escape", $"The escape", typeof(bool));
            var signature = new MethodSignature(
                Name: AppendPathMethodName,
                Modifiers: MethodSignatureModifiers.Public,
                Parameters: [valueParameter, escapeParameter],
                ReturnType: null,
                Description: null, ReturnDescription: null);

            var stringBuilder = PathAndQueryProperty.As<StringBuilder>();
            var pathLength = (ValueExpression)_pathLengthField;

            MethodBodyStatement body = new MethodBodyStatement[]
            {
                MethodBodyStatement.Empty,
                new IfStatement(escapeParameter)
                {
                    valueParameter.Assign(Static<Uri>().Invoke(nameof(Uri.EscapeDataString), [valueParameter])).Terminate()
                },
                MethodBodyStatement.Empty,
                // Check for double slashes: if path ends with '/' and value starts with '/'
                new IfStatement(pathLength.GreaterThan(Int(0)).And(stringBuilder.Index(new BinaryOperatorExpression(" - ", pathLength, Int(1))).Equal(Literal('/'))).And(valueParameter.As<string>().Index(Int(0)).Equal(Literal('/'))))
                {
                    stringBuilder.Remove(new BinaryOperatorExpression(" - ", pathLength, Int(1)), Int(1)).Terminate(),
                    _pathLengthField.Assign(new BinaryOperatorExpression(" - ", pathLength, Int(1))).Terminate()
                },
                MethodBodyStatement.Empty,
                stringBuilder.Invoke("Insert", [pathLength, valueParameter]).Terminate(),
                _pathLengthField.Assign(new BinaryOperatorExpression(" + ", pathLength, valueParameter.As<string>().Length())).Terminate()
            };

            return
                [
                new(signature, body, this, XmlDocProvider.Empty),
                BuildAppendPathMethod(typeof(bool), false, false),
                BuildAppendPathMethod(typeof(float), true, false),
                BuildAppendPathMethod(typeof(double), true, false),
                BuildAppendPathMethod(typeof(int), true, false),
                BuildAppendPathMethod(typeof(byte[]), true, true),
                BuildAppendPathMethod(typeof(DateTimeOffset), true, true),
                BuildAppendPathMethod(typeof(TimeSpan), true, true),
                BuildAppendPathMethod(typeof(Guid), true, false),
                BuildAppendPathMethod(typeof(long), true, false)
                ];
        }

        private MethodProvider BuildAppendPathMethod(CSharpType valueType, bool escapeDefaultValue, bool hasFormat)
        {
            var valueParameter = new ParameterProvider("value", $"The value.", valueType);
            var escapeParameter = new ParameterProvider("escape", $"The escape.", typeof(bool), Bool(escapeDefaultValue));
            var parameters = hasFormat
                ? new[] { valueParameter, _formatParameter, escapeParameter }
                : new[] { valueParameter, escapeParameter };

            var signature = new MethodSignature(
                Name: AppendPathMethodName,
                Modifiers: MethodSignatureModifiers.Public,
                Parameters: parameters,
                ReturnType: null,
                Description: null, ReturnDescription: null);
            var convertToStringExpression = valueParameter.ConvertToString(hasFormat ? (ValueExpression)_formatParameter : null);
            var body = new InvokeMethodExpression(null, AppendPathMethodName, [convertToStringExpression, escapeParameter]);

            return new(signature, body, this, XmlDocProvider.Empty);
        }

        private MethodProvider[] BuildAppendQueryMethods()
        {
            var nameParameter = new ParameterProvider("name", $"The name.", typeof(string));
            var valueParameter = new ParameterProvider("value", $"The value.", typeof(string));
            var escapeParameter = new ParameterProvider("escape", $"The escape.", typeof(bool));

            var signature = new MethodSignature(
                Name: AppendQueryMethodName,
                Modifiers: MethodSignatureModifiers.Public,
                Parameters: [nameParameter, valueParameter, escapeParameter],
                ReturnType: null,
                Description: null, ReturnDescription: null);

            var stringBuilder = PathAndQueryProperty.As<StringBuilder>();
            var pathLength = (ValueExpression)_pathLengthField;

            var body = new MethodBodyStatement[]
            {
                MethodBodyStatement.Empty,
                // Check if this is the first query parameter
                new IfStatement(stringBuilder.Length().Equal(pathLength))
                {
                    stringBuilder.Append(Literal('?')).Terminate()
                },
                new IfStatement(stringBuilder.Length().GreaterThan(pathLength).And(stringBuilder.Index(new BinaryOperatorExpression(" - ", stringBuilder.Length(), Int(1))).NotEqual(Literal('?'))))
                {
                    stringBuilder.Append(Literal('&')).Terminate()
                    stringBuilder.Append(Literal('&')).Terminate()
                },
                MethodBodyStatement.Empty,
                new IfStatement(escapeParameter)
                {
                    valueParameter.Assign(Static<Uri>().Invoke(nameof(Uri.EscapeDataString), [valueParameter])).Terminate()
                },
                MethodBodyStatement.Empty,
                stringBuilder.Append(nameParameter).Terminate(),
                stringBuilder.Append(Literal('=')).Terminate(),
                stringBuilder.Append(valueParameter).Terminate()
            };

            return
                [
                new MethodProvider(signature, body, this, XmlDocProvider.Empty),
                BuildAppendQueryMethod(typeof(bool), false, false),
                BuildAppendQueryMethod(typeof(float), true, false),
                BuildAppendQueryMethod(typeof(DateTimeOffset), true, true),
                BuildAppendQueryMethod(typeof(TimeSpan), true, true),
                BuildAppendQueryMethod(typeof(double), true, false),
                BuildAppendQueryMethod(typeof(decimal), true, false),
                BuildAppendQueryMethod(typeof(int), true, false),
                BuildAppendQueryMethod(typeof(long), true, false),
                BuildAppendQueryMethod(typeof(TimeSpan), true, false),
                BuildAppendQueryMethod(typeof(byte[]), true, true),
                BuildAppendQueryMethod(typeof(Guid), true, false)
                ];
        }

        private MethodProvider BuildAppendQueryMethod(CSharpType valueType, bool escapeDefaultValue, bool hasFormat)
        {
            var nameParameter = new ParameterProvider("name", $"The name.", typeof(string));
            var valueParameter = new ParameterProvider("value", $"The value.", valueType);
            var escapeParameter = new ParameterProvider("escape", $"Whether to escape the value.", typeof(bool), Bool(escapeDefaultValue));
            var serializationFormatType = ScmCodeModelGenerator.Instance.SerializationFormatDefinition.Type;
            var parameters = hasFormat
                ? new[] { nameParameter, valueParameter, _formatParameter, escapeParameter }
                : new[] { nameParameter, valueParameter, escapeParameter };

            var signature = new MethodSignature(
                Name: AppendQueryMethodName,
                Modifiers: MethodSignatureModifiers.Public,
                Parameters: parameters,
                ReturnType: null,
                Description: null, ReturnDescription: null);
            var convertToStringExpression = valueParameter.ConvertToString(hasFormat ? (ValueExpression)_formatParameter : null);
            var body = new InvokeMethodExpression(null, AppendQueryMethodName, [nameParameter, convertToStringExpression, escapeParameter]);

            return new(signature, body, this, XmlDocProvider.Empty);
        }

        private MethodProvider[] BuildAppendQueryDelimitedMethods()
        {
            return
            [
                BuildAppendDelimitedMethod(AppendQueryDelimitedMethodName, AppendQueryMethodName)
            ];
        }

        private MethodProvider[] BuildAppendPathDelimitedMethods()
        {
            return
            [
                BuildAppendDelimitedMethod(AppendPathDelimitedMethodName, AppendPathMethodName, false),
            ];
        }

        private readonly CSharpType _t = typeof(IEnumerable<>).GetGenericArguments()[0];

        private MethodProvider BuildAppendDelimitedMethod(string appendDelimitedMethodName, string appendMethodName, bool hasName = true)
        {
            var nameParameter = new ParameterProvider("name", $"The name.", typeof(string));
            var valueParameter =
                new ParameterProvider("value", $"The value.", new CSharpType(typeof(IEnumerable<>), _t));
            var delimiterParameter = new ParameterProvider("delimiter", $"The delimiter.", typeof(string));
            var escapeParameter = new ParameterProvider("escape", $"Whether to escape the value.", typeof(bool), Bool(true));

            var parameters = hasName
                ? new[] { nameParameter, valueParameter, delimiterParameter, _formatParameter, escapeParameter }
                : new[] { valueParameter, delimiterParameter, _formatParameter, escapeParameter };

            var signature = new MethodSignature(
                Name: appendDelimitedMethodName,
                Modifiers: MethodSignatureModifiers.Public,
                Parameters: parameters,
                ReturnType: null,
                GenericArguments: [_t],
                Description: null, ReturnDescription: null);

            var value = valueParameter.As(_t);

            var v = new VariableExpression(_t, "v");
            var convertToStringExpression = v.ConvertToString(_formatParameter);
            var selector = new FuncExpression([v.Declaration], convertToStringExpression).As<string>();
            var body = new[]
            {
                delimiterParameter.Assign(Literal(","), true).Terminate(),
                Declare("stringValues", value.Select(selector), out var stringValues),
                hasName ? new InvokeMethodExpression(
                            null, appendMethodName,
                        [nameParameter, StringSnippets.Join(delimiterParameter, stringValues), escapeParameter])
                        .Terminate()
                    : new InvokeMethodExpression(null, appendMethodName, [StringSnippets.Join(delimiterParameter, stringValues), escapeParameter])
                    .Terminate()
            };
            return new(signature, body, this, XmlDocProvider.Empty);
        }

        private MethodProvider BuildToUriMethod()
        {
            var signature = new MethodSignature(
                Name: ToUriMethodName,
                Modifiers: MethodSignatureModifiers.Public,
                Parameters: Array.Empty<ParameterProvider>(),
                ReturnType: typeof(Uri),
                Description: null, ReturnDescription: null);

            var stringBuilder = PathAndQueryProperty.As<StringBuilder>();
            var pathLength = (ValueExpression)_pathLengthField;

            var body = new MethodBodyStatement[]
            {
                // Set the path portion
                UriBuilderPath.Assign(stringBuilder.Invoke("ToString", [Int(0), pathLength])).Terminate(),
                MethodBodyStatement.Empty,
                // Set the query portion if it exists
                new IfStatement(stringBuilder.Length().GreaterThan(pathLength))
                {
                    UriBuilderQuery.Assign(stringBuilder.Invoke("ToString", [new BinaryOperatorExpression(" + ", pathLength, Int(1)), new BinaryOperatorExpression(" - ", new BinaryOperatorExpression(" - ", stringBuilder.Length(), pathLength), Int(1))])).Terminate()
                },
                new IfStatement(stringBuilder.Length().Equal(pathLength))
                {
                    UriBuilderQuery.Assign(Literal("")).Terminate()
                },
                MethodBodyStatement.Empty,
                Return(new MemberExpression(UriBuilderProperty, nameof(UriBuilder.Uri)))
            };

            return new(signature, body, this, XmlDocProvider.Empty);
        }
    }
}
