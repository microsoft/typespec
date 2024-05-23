// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using static Microsoft.Generator.CSharp.Expressions.Snippets;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record EnumExpression(EnumTypeProvider EnumType, ValueExpression Untyped) : TypedValueExpression(EnumType.Type, Untyped)
    {
        public FrameworkTypeExpression ToSerial()
        {
            var valueType = EnumType.ValueType;
            // we are finding a method on the extension class associating with the enum or the enum itself if absent to convert the value for us.
            var typeToFind = EnumType.Serialization ?? EnumType;
            // we find a method that returns its value type
            var methodSignature = FindMethodSignature(typeToFind.Methods, valueType);

            // we have to construct different expression based on whether the method is static or not
            if (methodSignature is null)
            {
                // if there is no method for convert the enum to the value, we directly cast it.
                return new FrameworkTypeExpression(valueType.FrameworkType, Untyped.CastTo(valueType));
            }
            else if (methodSignature.Modifiers.HasFlag(MethodSignatureModifiers.Static))
            {
                // if the method we found is static, call it using InvokeStaticMethodExpression
                return new FrameworkTypeExpression(valueType.FrameworkType, new InvokeStaticMethodExpression(typeToFind.Type, methodSignature.Name, [Untyped], CallAsExtension: methodSignature.Modifiers.HasFlag(MethodSignatureModifiers.Extension)));
            }
            else
            {
                // if the method we found is not static, call it using instance method.
                return new FrameworkTypeExpression(valueType.FrameworkType, Untyped.Invoke(methodSignature));
            }
        }

        public static EnumExpression ToEnum(EnumTypeProvider enumType, ValueExpression value)
        {
            var typeToFind = enumType.Serialization ?? enumType;
            var methodSignature = FindMethodSignature(typeToFind.Methods, enumType.Type);

            if (methodSignature is null)
            {
                // if no method was found, which means there is no method to convert a value to the enum, we call the ctor
                return new EnumExpression(enumType, New.Instance(enumType.Type, value));
            }
            else
            {
                return new EnumExpression(enumType, new InvokeStaticMethodExpression(enumType.Type, methodSignature.Name, [value], CallAsExtension: methodSignature.Modifiers.HasFlag(MethodSignatureModifiers.Extension)));
            }
        }

        private static MethodSignature? FindMethodSignature(IEnumerable<CSharpMethod> methods, CSharpType returnType)
        {
            var methodSignatures = methods.Where(m => m.Signature is MethodSignature { ReturnType: not null } signature && !signature.Modifiers.HasFlag(MethodSignatureModifiers.Operator) && signature.Name.StartsWith("To")).Select(m => (MethodSignature)m.Signature);
            return methodSignatures.SingleOrDefault(signature => signature.ReturnType!.Equals(returnType)); // there must be one therefore we use `SingleOrDefault` to let it throw when there is multiple
        }
    }
}
