// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public abstract partial class ExtensibleSnippets
    {
        public abstract ModelSnippets Model { get; }
        public abstract RestOperationsSnippets RestOperations { get; }

        protected static InvokeStaticMethodExpression InvokeExtension(CSharpType extensionType, ValueExpression instance, string methodName)
            => new(extensionType, methodName, new[] { instance }, CallAsAsync: false, CallAsExtension: true);

        protected static InvokeStaticMethodExpression InvokeExtension(CSharpType extensionType, ValueExpression instance, string methodName, ValueExpression arg)
            => new(extensionType, methodName, new[] { instance, arg }, CallAsAsync: false, CallAsExtension: true);
    }
}
