// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record InvokeStaticMethodExpression(CSharpType? MethodType, string MethodName, IReadOnlyList<ValueExpression> Arguments, IReadOnlyList<CSharpType>? TypeArguments = null, bool CallAsExtension = false, bool CallAsAsync = false) : ValueExpression
    {
        public InvokeStaticMethodExpression(CSharpType? methodType, string methodName, ValueExpression arg, IReadOnlyList<CSharpType>? typeArguments = null, bool callAsExtension = false, bool callAsAsync = false)
            : this(methodType, methodName, [arg], typeArguments, callAsExtension, callAsAsync) { }

        public static InvokeStaticMethodExpression Extension(CSharpType? methodType, string methodName, ValueExpression instanceReference) => new(methodType, methodName, new[] { instanceReference }, CallAsExtension: true);
        public static InvokeStaticMethodExpression Extension(CSharpType? methodType, string methodName, ValueExpression instanceReference, ValueExpression arg) => new(methodType, methodName, new[] { instanceReference, arg }, CallAsExtension: true);
        public static InvokeStaticMethodExpression Extension(CSharpType? methodType, string methodName, ValueExpression instanceReference, IReadOnlyList<ValueExpression> arguments)
            => new(methodType, methodName, arguments.Prepend(instanceReference).ToArray(), CallAsExtension: true);

        public MethodBodyStatement ToStatement()
            => new InvokeStaticMethodStatement(MethodType, MethodName, Arguments, TypeArguments, CallAsExtension, CallAsAsync);

        internal override void Write(CodeWriter writer)
        {
            if (CallAsExtension)
            {
                writer.AppendRawIf("await ", CallAsAsync);
                if (MethodType != null)
                {
                    writer.UseNamespace(MethodType.Namespace);
                }

                Arguments[0].Write(writer);
                writer.AppendRaw(".");
                writer.AppendRaw(MethodName);
                writer.WriteTypeArguments(TypeArguments);
                writer.WriteArguments(Arguments.Skip(1));
                writer.AppendRawIf(".ConfigureAwait(false)", CallAsAsync);
            }
            else
            {
                writer.AppendRawIf("await ", CallAsAsync);
                if (MethodType != null)
                {
                    writer.Append($"{MethodType}.");
                }

                writer.AppendRaw(MethodName);
                writer.WriteTypeArguments(TypeArguments);
                writer.WriteArguments(Arguments);
                writer.AppendRawIf(".ConfigureAwait(false)", CallAsAsync);
            }
        }
    }
}
