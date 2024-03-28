// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Output.Models.Serialization;
using Azure.Core;
using static AutoRest.CSharp.Common.Output.Models.Snippets;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions.Azure
{
    internal sealed record RequestHeadersExpression(ValueExpression Untyped) : TypedValueExpression<RequestHeaders>(Untyped)
    {
        public MethodBodyStatement Add(ValueExpression conditions)
            => new InvokeStaticMethodStatement(typeof(RequestUriBuilderExtensions), nameof(RequestHeaderExtensions.Add), new[] { Untyped, conditions }, CallAsExtension: true);
        public MethodBodyStatement Add(ValueExpression conditions, SerializationFormat format)
            => new InvokeStaticMethodStatement(typeof(RequestUriBuilderExtensions), nameof(RequestHeaderExtensions.Add), new[] { Untyped, conditions, Literal(format.ToFormatSpecifier()) }, CallAsExtension: true);

        public MethodBodyStatement Add(string name, ValueExpression value)
            => new InvokeStaticMethodStatement(typeof(RequestUriBuilderExtensions), nameof(RequestHeaderExtensions.Add), new[] { Untyped, Literal(name), value }, CallAsExtension: true);
        public MethodBodyStatement Add(string name, ValueExpression value, string format)
            => new InvokeStaticMethodStatement(typeof(RequestUriBuilderExtensions), nameof(RequestHeaderExtensions.Add), new[] { Untyped, Literal(name), value, Literal(format) }, CallAsExtension: true);
        public MethodBodyStatement Add(string name, ValueExpression value, SerializationFormat format)
            => format.ToFormatSpecifier() is { } formatSpecifier
                ? Add(name, value, formatSpecifier)
                : Add(name, value);

        public MethodBodyStatement AddDelimited(string name, ValueExpression value, string delimiter)
            => new InvokeStaticMethodStatement(typeof(RequestUriBuilderExtensions), nameof(RequestHeaderExtensions.AddDelimited), new[] { Untyped, Literal(name), value, Literal(delimiter) }, CallAsExtension: true);
        public MethodBodyStatement AddDelimited(string name, ValueExpression value, string delimiter, string format)
            => new InvokeStaticMethodStatement(typeof(RequestUriBuilderExtensions), nameof(RequestHeaderExtensions.AddDelimited), new[] { Untyped, Literal(name), value, Literal(delimiter), Literal(format) }, CallAsExtension: true);
        public MethodBodyStatement AddDelimited(string name, ValueExpression value, string delimiter, SerializationFormat format)
            => format.ToFormatSpecifier() is { } formatSpecifier
                ? AddDelimited(name, value, delimiter, formatSpecifier)
                : AddDelimited(name, value, delimiter);
    }
}
