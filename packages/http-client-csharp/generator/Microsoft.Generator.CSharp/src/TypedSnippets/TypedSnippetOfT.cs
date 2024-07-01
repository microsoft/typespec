// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.Snippets
{
#pragma warning disable SA1649 // File name should match first type name
    public abstract record TypedSnippet<T>(ValueExpression Expression) : TypedSnippet(typeof(T), ValidateType(Expression, typeof(T)))
#pragma warning restore SA1649 // File name should match first type name
    {
        protected static MemberExpression StaticProperty(string name) => new(typeof(T), name);

        protected static InvokeStaticMethodExpression InvokeStatic(string methodName)
            => new(typeof(T), methodName, Array.Empty<ValueExpression>(), null, false);

        protected static InvokeStaticMethodExpression InvokeStatic(string methodName, ValueExpression arg)
            => new(typeof(T), methodName, new[] { arg }, null, false);

        protected static InvokeStaticMethodExpression InvokeStatic(string methodName, ValueExpression arg1, ValueExpression arg2)
            => new(typeof(T), methodName, new[] { arg1, arg2 }, null, false);

        protected static InvokeStaticMethodExpression InvokeStatic(string methodName, IReadOnlyList<ValueExpression> arguments)
            => new(typeof(T), methodName, arguments, null, false);

        protected static InvokeStaticMethodExpression InvokeStatic(MethodSignature method)
            => new(typeof(T), method.Name, method.Parameters.Select(p => (ValueExpression)p).ToList());

        protected static InvokeStaticMethodExpression InvokeStatic(MethodSignature method, bool async)
            => new(typeof(T), method.Name, method.Parameters.Select(p => (ValueExpression)p).ToList(), CallAsAsync: async);

        protected static InvokeStaticMethodExpression InvokeStatic(string methodName, bool async)
            => new(typeof(T), methodName, Array.Empty<ValueExpression>(), CallAsAsync: async);

        protected static InvokeStaticMethodExpression InvokeStatic(string methodName, ValueExpression arg, bool async)
            => new(typeof(T), methodName, new[] { arg }, CallAsAsync: async);

        protected static InvokeStaticMethodExpression InvokeStatic(string methodName, IReadOnlyList<ValueExpression> arguments, bool async)
            => new(typeof(T), methodName, arguments, CallAsAsync: async);

        protected InvokeStaticMethodExpression InvokeExtension(CSharpType extensionType, string methodName)
            => new(extensionType, methodName, new[] { Expression }, CallAsAsync: false, CallAsExtension: true);

        protected InvokeStaticMethodExpression InvokeExtension(CSharpType extensionType, string methodName, ValueExpression arg)
            => new(extensionType, methodName, new[] { Expression, arg }, CallAsAsync: false, CallAsExtension: true);

        protected InvokeStaticMethodExpression InvokeExtension(CSharpType extensionType, string methodName, ValueExpression arg1, ValueExpression arg2)
            => new(extensionType, methodName, new[] { Expression, arg1, arg2 }, CallAsAsync: false, CallAsExtension: true);

        protected InvokeStaticMethodExpression InvokeExtension(CSharpType extensionType, string methodName, IEnumerable<ValueExpression> arguments, bool async)
            => new(extensionType, methodName, arguments.Prepend(Expression).ToArray(), CallAsAsync: async, CallAsExtension: true);

        private static ValueExpression ValidateType(ValueExpression expression, Type type)
        {
            return expression;
        }
    }
}
