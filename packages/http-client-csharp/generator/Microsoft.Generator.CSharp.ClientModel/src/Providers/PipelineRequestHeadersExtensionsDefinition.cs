// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal class PipelineRequestHeadersExtensionsDefinition : TypeProvider
    {
        private const string _setDelimited = "SetDelimited";
        private ParameterProvider _pipelineRequestHeadersParam;
        public PipelineRequestHeadersExtensionsDefinition()
        {
            _pipelineRequestHeadersParam = new ParameterProvider("headers", FormattableStringHelpers.Empty, typeof(PipelineRequestHeaders));
        }
        private readonly CSharpType _t = typeof(IEnumerable<>).GetGenericArguments()[0];
        protected override TypeSignatureModifiers GetDeclarationModifiers()
        {
            return TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static;
        }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override string BuildName() => "PipelineRequestHeadersExtensions";

        protected override MethodProvider[] BuildMethods()
        {
            return
            [
                BuildSetDelimited(false),
                BuildSetDelimited(true),
            ];
        }

        private MethodProvider BuildSetDelimited(bool hasFormat)
        {
            var nameParameter = new ParameterProvider("name", $"The name.", typeof(string));
            var valueParameter = new ParameterProvider("value", $"The value.", new CSharpType(typeof(IEnumerable<>), _t));
            var delimiterParameter = new ParameterProvider("delimiter", $"The delimiter.", typeof(string));
            var formatParameter = new ParameterProvider("format", $"The format.", typeof(string));
            var modifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Extension;
            var parameters = hasFormat
                ? new[] { _pipelineRequestHeadersParam, nameParameter, valueParameter, delimiterParameter, formatParameter }
                : new[] { _pipelineRequestHeadersParam, nameParameter, valueParameter, delimiterParameter };
            MethodSignature signature = new MethodSignature(
                Name: _setDelimited,
                Modifiers: modifiers,
                Parameters: parameters,
                ReturnType: null,
                GenericArguments: [_t],
                Description: null,
                ReturnDescription: null);

            var value = valueParameter.As(_t);
            var v = new VariableExpression(_t, "v");
            var convertToStringExpression = TypeFormattersSnippets.ConvertToString(v, hasFormat ? formatParameter : (ValueExpression?)null);
            var selector = new FuncExpression([v.Declaration], convertToStringExpression).As<string>();
            var body = new[]
            {
                Declare("stringValues", value.Select(selector), out var stringValues),
               new InvokeMethodExpression(_pipelineRequestHeadersParam, "Set", [nameParameter, StringSnippets.Join(delimiterParameter, stringValues)]).Terminate()
            };

            return new(signature, body, this);
        }
    }
}
