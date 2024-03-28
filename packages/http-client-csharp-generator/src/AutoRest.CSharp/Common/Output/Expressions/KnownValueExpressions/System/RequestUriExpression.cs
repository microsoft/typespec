// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Internal;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Output.Models.Serialization;
using static AutoRest.CSharp.Common.Output.Models.Snippets;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions.System
{
    internal sealed record RequestUriExpression(ValueExpression Untyped) : TypedValueExpression<RequestUri>(Untyped)
    {
        public TypedValueExpression ToUri() => new FrameworkTypeExpression(typeof(Uri), Invoke(nameof(RequestUri.ToUri)));

        public MethodBodyStatement Reset(ValueExpression uri) => new InvokeInstanceMethodStatement(Untyped, nameof(RequestUri.Reset), uri);

        public MethodBodyStatement AppendRawPathOrQueryOrHostOrScheme(string value, bool escape) => new InvokeInstanceMethodStatement(Untyped, nameof(RequestUri.AppendRawPathOrQueryOrHostOrScheme), Literal(value), Bool(escape));
        public MethodBodyStatement AppendRawPathOrQueryOrHostOrScheme(ValueExpression value, bool escape) => new InvokeInstanceMethodStatement(Untyped, nameof(RequestUri.AppendRawPathOrQueryOrHostOrScheme), value, Bool(escape));

        public MethodBodyStatement AppendPath(string value, bool escape) => new InvokeInstanceMethodStatement(Untyped, nameof(RequestUri.AppendPath), Literal(value), Bool(escape));
        public MethodBodyStatement AppendPath(ValueExpression value, bool escape) => new InvokeInstanceMethodStatement(Untyped, nameof(RequestUri.AppendPath), value, Bool(escape));
        public MethodBodyStatement AppendPath(ValueExpression value, string formatSpecifier, bool escape) => new InvokeInstanceMethodStatement(Untyped, nameof(RequestUri.AppendPath), new[]{ value, Literal(formatSpecifier), Bool(escape) }, false);

        public MethodBodyStatement AppendPath(ValueExpression value, SerializationFormat format, bool escape)
            => format.ToFormatSpecifier() is { } formatSpecifier
                ? AppendPath(value, formatSpecifier, escape)
                : AppendPath(value, escape);

        public MethodBodyStatement AppendQuery(string name, TypedValueExpression value, bool escape)
            => new InvokeInstanceMethodStatement(Untyped, nameof(RequestUri.AppendQuery), new[]{ Literal(name), value, Bool(escape) }, false);
        public MethodBodyStatement AppendQuery(string name, TypedValueExpression value, string format, bool escape)
            => new InvokeInstanceMethodStatement(Untyped, nameof(RequestUri.AppendQuery), new[]{ Literal(name), value, Literal(format), Bool(escape) }, false);
        public MethodBodyStatement AppendQuery(string name, TypedValueExpression value, SerializationFormat format, bool escape)
            => format.ToFormatSpecifier() is { } formatSpecifier
                ? AppendQuery(name, value, formatSpecifier, escape)
                : AppendQuery(name, value, escape);

        public MethodBodyStatement AppendQueryDelimited(string name, ValueExpression value, string delimiter, bool escape)
            => new InvokeInstanceMethodStatement(Untyped, nameof(RequestUri.AppendQueryDelimited), new[]{ Literal(name), value, Literal(delimiter), Bool(escape) }, false);
        public MethodBodyStatement AppendQueryDelimited(string name, ValueExpression value, string delimiter, string format, bool escape)
            => new InvokeInstanceMethodStatement(Untyped, nameof(RequestUri.AppendQueryDelimited), new[]{ Literal(name), value, Literal(delimiter), Literal(format), Bool(escape) }, false);
        public MethodBodyStatement AppendQueryDelimited(string name, ValueExpression value, string delimiter, SerializationFormat format, bool escape)
            => format.ToFormatSpecifier() is { } formatSpecifier
                ? AppendQueryDelimited(name, value, delimiter, formatSpecifier, escape)
                : AppendQueryDelimited(name, value, delimiter, escape);
    }
}
