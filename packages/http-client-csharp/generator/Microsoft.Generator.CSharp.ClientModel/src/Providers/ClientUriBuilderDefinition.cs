// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
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
        private readonly FieldProvider _pathBuilderField;
        private readonly FieldProvider _queryBuilderField;

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

        private PropertyProvider? _pathBuilderProperty;
        private PropertyProvider PathBuilderProperty => _pathBuilderProperty ??= new(
            modifiers: MethodSignatureModifiers.Private,
            name: "PathBuilder",
            type: typeof(StringBuilder),
            body: new ExpressionPropertyBody(new BinaryOperatorExpression(" ??= ", _pathBuilderField, New.Instance(typeof(StringBuilder), UriBuilderPath))),
            description: null,
            enclosingType: this);

        private PropertyProvider? _queryBuilderProperty;
        private PropertyProvider QueryBuilderProperty => _queryBuilderProperty ??= new(
            modifiers: MethodSignatureModifiers.Private,
            name: "QueryBuilder",
            type: typeof(StringBuilder),
            body: new ExpressionPropertyBody(new BinaryOperatorExpression(" ??= ", _queryBuilderField, New.Instance(typeof(StringBuilder), UriBuilderQuery))),
            description: null,
            enclosingType: this);

        public ClientUriBuilderDefinition()
        {
            _uriBuilderField = new(FieldModifiers.Private, typeof(UriBuilder), "_uriBuilder", this);
            _pathBuilderField = new(FieldModifiers.Private, typeof(StringBuilder), "_pathBuilder", this);
            _queryBuilderField = new(FieldModifiers.Private, typeof(StringBuilder), "_queryBuilder", this);
        }

        protected override TypeSignatureModifiers GetDeclarationModifiers()
        {
            return TypeSignatureModifiers.Internal;
        }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override string BuildName() => "ClientUriBuilder";

        protected override FieldProvider[] BuildFields()
        {
            return [_uriBuilderField, _pathBuilderField, _queryBuilderField];
        }

        protected override PropertyProvider[] BuildProperties()
        {
            return [UriBuilderProperty, PathBuilderProperty, QueryBuilderProperty];
        }

        protected override ConstructorProvider[] BuildConstructors()
        {
            var signature = new ConstructorSignature(
                Type: Type,
                Modifiers: MethodSignatureModifiers.Public,
                Parameters: Array.Empty<ParameterProvider>(),
                Description: null);
            return [new ConstructorProvider(signature, MethodBodyStatement.Empty, this)];
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

            var body = new MethodBodyStatement[]
            {
                _uriBuilderField.Assign(New.Instance(_uriBuilderField.Type, uriParameter)).Terminate(),
                _pathBuilderField.Assign(New.Instance(_pathBuilderField.Type, UriBuilderPath)).Terminate(),
                _queryBuilderField.Assign(New.Instance(_queryBuilderField.Type, UriBuilderQuery)).Terminate()
            };

            return new(signature, body, this);
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

            var pathBuilder = PathBuilderProperty.As<StringBuilder>();
            MethodBodyStatement body = new MethodBodyStatement[]
            {
                MethodBodyStatement.Empty,
                new IfStatement(escapeParameter)
                {
                    valueParameter.Assign(Static<Uri>().Invoke(nameof(Uri.EscapeDataString), [valueParameter])).Terminate()
                },
                MethodBodyStatement.Empty,
                new IfStatement(pathBuilder.Length().GreaterThan(Int(0)).And(pathBuilder.Index(pathBuilder.Length().Minus(Int(1))).Equal(Literal('/'))).And(valueParameter.As<string>().Index(Int(0)).Equal(Literal('/'))))
                {
                    pathBuilder.Remove(pathBuilder.Length().Minus(Int(1)), Int(1)).Terminate()
                },
                MethodBodyStatement.Empty,
                pathBuilder.Append(valueParameter).Terminate(),
                UriBuilderPath.Assign(pathBuilder.InvokeToString()).Terminate()
            };

            return
                [
                new(signature, body, this),
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
            var formatParameter = new ParameterProvider("format", $"The format", typeof(string));
            var parameters = hasFormat
                ? new[] { valueParameter, formatParameter, escapeParameter }
                : new[] { valueParameter, escapeParameter };

            var signature = new MethodSignature(
                Name: AppendPathMethodName,
                Modifiers: MethodSignatureModifiers.Public,
                Parameters: parameters,
                ReturnType: null,
                Description: null, ReturnDescription: null);
            var convertToStringExpression = TypeFormattersSnippets.ConvertToString(valueParameter, hasFormat ? (ValueExpression)formatParameter : null);
            var body = new InvokeMethodExpression(null, AppendPathMethodName, [convertToStringExpression, escapeParameter]);

            return new(signature, body, this);
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

            var queryBuilder = QueryBuilderProperty.As<StringBuilder>();
            var body = new MethodBodyStatement[]
            {
                MethodBodyStatement.Empty,
                new IfStatement(queryBuilder.Length().GreaterThan(Int(0)))
                {
                    queryBuilder.Append(Literal('&')).Terminate()
                },
                MethodBodyStatement.Empty,
                new IfStatement(escapeParameter)
                {
                    valueParameter.Assign(Static<Uri>().Invoke(nameof(Uri.EscapeDataString), [valueParameter])).Terminate()
                },
                MethodBodyStatement.Empty,
                queryBuilder.Append(nameParameter).Terminate(),
                queryBuilder.Append(Literal('=')).Terminate(),
                queryBuilder.Append(valueParameter).Terminate()
            };

            return
                [
                new MethodProvider(signature, body, this),
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
            var escapeParameter = new ParameterProvider("escape", $"The escape.", typeof(bool), Bool(escapeDefaultValue));
            var formatParameter = new ParameterProvider("format", $"The format.", typeof(string));
            var parameters = hasFormat
                ? new[] { nameParameter, valueParameter, formatParameter, escapeParameter }
                : new[] { nameParameter, valueParameter, escapeParameter };

            var signature = new MethodSignature(
                Name: AppendQueryMethodName,
                Modifiers: MethodSignatureModifiers.Public,
                Parameters: parameters,
                ReturnType: null,
                Description: null, ReturnDescription: null);
            var convertToStringExpression = TypeFormattersSnippets.ConvertToString(valueParameter, hasFormat ? (ValueExpression)formatParameter : null);
            var body = new InvokeMethodExpression(null, AppendQueryMethodName, [nameParameter, convertToStringExpression, escapeParameter]);

            return new(signature, body, this);
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
            var formatParameter = new ParameterProvider("format", $"The format.", typeof(string), Literal(null));
            var escapeParameter = new ParameterProvider("escape", $"The escape.", typeof(bool), Bool(true));

            var parameters = hasName
                ? new[] { nameParameter, valueParameter, delimiterParameter, formatParameter, escapeParameter }
                : new[] { valueParameter, delimiterParameter, formatParameter, escapeParameter };

            var signature = new MethodSignature(
                Name: appendDelimitedMethodName,
                Modifiers: MethodSignatureModifiers.Public,
                Parameters: parameters,
                ReturnType: null,
                GenericArguments: [_t],
                Description: null, ReturnDescription: null);

            var value = valueParameter.As(_t);

            var v = new VariableExpression(_t, "v");
            var convertToStringExpression = v.ConvertToString(formatParameter);
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
            return new(signature, body, this);
        }

        private MethodProvider BuildToUriMethod()
        {
            var signature = new MethodSignature(
                Name: ToUriMethodName,
                Modifiers: MethodSignatureModifiers.Public,
                Parameters: Array.Empty<ParameterProvider>(),
                ReturnType: typeof(Uri),
                Description: null, ReturnDescription: null);

            var pathBuilder = (ValueExpression)_pathBuilderField;
            var queryBuilder = (ValueExpression)_queryBuilderField;
            var body = new MethodBodyStatement[]
            {
                new IfStatement(pathBuilder.NotEqual(Null))
                {
                    UriBuilderPath.Assign(pathBuilder.InvokeToString()).Terminate()
                },
                MethodBodyStatement.Empty,
                new IfStatement(queryBuilder.NotEqual(Null))
                {
                    UriBuilderQuery.Assign(queryBuilder.InvokeToString()).Terminate()
                },
                MethodBodyStatement.Empty,
                Return(new MemberExpression(UriBuilderProperty, nameof(UriBuilder.Uri)))
            };

            return new(signature, body, this);
        }
    }
}
