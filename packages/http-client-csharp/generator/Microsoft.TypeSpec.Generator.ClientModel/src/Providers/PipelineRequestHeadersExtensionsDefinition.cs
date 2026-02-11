// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
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
        protected override TypeSignatureModifiers BuildDeclarationModifiers()
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
            var serializationFormatType = ScmCodeModelGenerator.Instance.SerializationFormatDefinition.Type;
            var formatParameter = new ParameterProvider("format", $"The format.", serializationFormatType);
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
            var convertToStringExpression = v.ConvertToString(hasFormat ? formatParameter : (ValueExpression?)null);
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
