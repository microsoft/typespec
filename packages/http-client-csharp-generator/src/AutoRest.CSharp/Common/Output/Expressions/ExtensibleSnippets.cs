// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Generation.Types;

namespace AutoRest.CSharp.Common.Output.Expressions
{
    internal abstract partial class ExtensibleSnippets
    {
        public abstract JsonElementSnippets JsonElement { get; }
        public abstract ModelSnippets Model { get; }
        public abstract RestOperationsSnippets RestOperations { get; }
        public abstract XElementSnippets XElement { get; }
        public abstract XmlWriterSnippets XmlWriter { get; }

        protected static InvokeStaticMethodExpression InvokeExtension(CSharpType extensionType, ValueExpression instance, string methodName)
            => new(extensionType, methodName, new[] { instance }, CallAsAsync: false, CallAsExtension: true);

        protected static InvokeStaticMethodExpression InvokeExtension(CSharpType extensionType, ValueExpression instance, string methodName, ValueExpression arg)
            => new(extensionType, methodName, new[] { instance, arg }, CallAsAsync: false, CallAsExtension: true);
    }
}
