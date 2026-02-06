// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Xml.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public sealed partial class ModelSerializationExtensionsDefinition
    {
        private readonly ParameterProvider _xElementParameter =
            new ParameterProvider("element", FormattableStringHelpers.Empty, typeof(XElement));

        private MethodProvider[] BuildXmlExtensionMethods()
        {
            if (!ScmCodeModelGenerator.Instance.InputLibrary.HasXmlModelSerialization)
            {
                return [];
            }

            return
            [
                BuildXmlGetDateTimeOffsetMethodProvider(),
                BuildXmlGetTimeSpanMethodProvider(),
                BuildXmlGetBytesFromBase64MethodProvider()
            ];
        }

        private MethodProvider BuildXmlGetDateTimeOffsetMethodProvider()
        {
            var signature = new MethodSignature(
                Name: _getDateTimeOffsetMethodName,
                Modifiers: _methodModifiers,
                Parameters: [_xElementParameter, _formatParameter],
                ReturnType: typeof(DateTimeOffset),
                Description: null,
                ReturnDescription: null);

            var element = _xElementParameter.As<XElement>();
            var body = new SwitchExpression(
                _formatParameter,
                new SwitchCaseExpression(Literal("U"), DateTimeOffsetSnippets.FromUnixTimeSeconds(element.CastTo(typeof(long)))),
                SwitchCaseExpression.Default(TypeFormattersSnippets.ParseDateTimeOffset(element.Value(), _formatParameter)));

            return new MethodProvider(signature, body, this, XmlDocProvider.Empty);
        }

        private MethodProvider BuildXmlGetTimeSpanMethodProvider()
        {
            var signature = new MethodSignature(
                Name: _getTimeSpanMethodName,
                Modifiers: _methodModifiers,
                Parameters: [_xElementParameter, _formatParameter],
                ReturnType: typeof(TimeSpan),
                Description: null,
                ReturnDescription: null);

            var element = _xElementParameter.As<XElement>();
            var body = TypeFormattersSnippets.ParseTimeSpan(element.Value(), _formatParameter);

            return new MethodProvider(signature, body, this, XmlDocProvider.Empty);
        }

        private MethodProvider BuildXmlGetBytesFromBase64MethodProvider()
        {
            var signature = new MethodSignature(
                Name: _getBytesFromBase64MethodName,
                Modifiers: _methodModifiers,
                Parameters: [_xElementParameter, _formatParameter],
                ReturnType: typeof(byte[]),
                Description: null,
                ReturnDescription: null);

            var element = _xElementParameter.As<XElement>();
            var body = new SwitchExpression(
                _formatParameter,
                new SwitchCaseExpression(Literal("U"), TypeFormattersSnippets.FromBase64UrlString(element.Value())),
                new SwitchCaseExpression(Literal("D"), Static(typeof(Convert)).Invoke(nameof(Convert.FromBase64String), element.Value())),
                SwitchCaseExpression.Default(ThrowExpression(New.ArgumentException(_formatParameter, Literal("Format is not supported: "), true))));

            return new MethodProvider(signature, body, this, XmlDocProvider.Empty);
        }
    }
}
