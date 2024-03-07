// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models;
using Azure.Core;

namespace AutoRest.CSharp.Common.Output.Expressions.Azure
{
    internal partial class AzureExtensibleSnippets
    {
        private class AzureXmlWriterSnippets : XmlWriterSnippets
        {
            public override MethodBodyStatement WriteValue(XmlWriterExpression xmlWriter, ValueExpression value, string format)
                => new InvokeStaticMethodStatement(typeof(XmlWriterExtensions), nameof(XmlWriterExtensions.WriteValue), new[] { xmlWriter, value, Snippets.Literal(format) }, CallAsExtension: true);

            public override MethodBodyStatement WriteObjectValue(XmlWriterExpression xmlWriter, ValueExpression value, string? nameHint)
                => new InvokeStaticMethodStatement(typeof(XmlWriterExtensions), nameof(XmlWriterExtensions.WriteObjectValue), new[] { xmlWriter, value, Snippets.Literal(nameHint) }, CallAsExtension: true);
        }
    }
}
