// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models;

namespace AutoRest.CSharp.Common.Output.Expressions.ValueExpressions
{
#pragma warning disable SA1649 // File name should match first type name
    internal abstract record TypedValueExpression<T>(ValueExpression Untyped) : TypedValueExpression(typeof(T), ValidateType(Untyped, typeof(T)))
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
            => new(extensionType, methodName, new[] { Untyped }, CallAsAsync: false, CallAsExtension: true);

        protected InvokeStaticMethodExpression InvokeExtension(CSharpType extensionType, string methodName, ValueExpression arg)
            => new(extensionType, methodName, new[] { Untyped, arg }, CallAsAsync: false, CallAsExtension: true);

        protected InvokeStaticMethodExpression InvokeExtension(CSharpType extensionType, string methodName, ValueExpression arg1, ValueExpression arg2)
            => new(extensionType, methodName, new[] { Untyped, arg1, arg2 }, CallAsAsync: false, CallAsExtension: true);

        protected InvokeStaticMethodExpression InvokeExtension(CSharpType extensionType, string methodName, IEnumerable<ValueExpression> arguments, bool async)
            => new(extensionType, methodName, arguments.Prepend(Untyped).ToArray(), CallAsAsync: async, CallAsExtension: true);

        private static ValueExpression ValidateType(ValueExpression untyped, Type type)
        {
#if DEBUG
            if (untyped is not TypedValueExpression typed)
            {
                return untyped;
            }

            if (typed.Type.IsFrameworkType)
            {
                if (typed.Type.FrameworkType.IsGenericTypeDefinition && type.IsGenericType)
                {
                    if (typed.Type.FrameworkType.MakeGenericType(type.GetGenericArguments()).IsAssignableTo(type))
                    {
                        return typed.Untyped;
                    }
                }
                else if (typed.Type.FrameworkType.IsAssignableTo(type))
                {
                    return typed.Untyped;
                }
            }

            throw new InvalidOperationException($"Expression with return type {typed.Type.Name} is cast to type {type.Name}");
#else
            return untyped;
#endif
        }
    }
}
