// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Snippets
{
    public static class CSharpTypeSnippets
    {
        public static ValueExpression ToEnum(this CSharpType type, ValueExpression valueExpression)
        {
            if (type.IsStruct)
            {
                return New.Instance(type, valueExpression);
            }
            else
            {
                return valueExpression.Invoke($"To{type.Name}");
            }
        }

        public static ValueExpression Deserialize(this CSharpType type, ValueExpression element, ValueExpression? data, ValueExpression? options)
        {
            List<ValueExpression> arguments;
            if (options is null)
            {
                arguments = [element];
            }
            else if (data is null)
            {
                arguments = [element, options];
            }
            else
            {
                arguments = [element, data, options];
            }

            return Static(type).Invoke($"Deserialize{type.Name}", arguments);
        }

        public static ValueExpression ToSerial(this CSharpType type, ParameterProvider param)
        {
            if (!type.IsEnum)
                throw new InvalidOperationException($"Can't call ToSerial on non-enum type {type.Name}");

            ValueExpression variable = param.Field is null ? param : param.Field;
            ValueExpression invokeVariable = variable;
            if (param.Type.IsNullable)
            {
                invokeVariable = variable.NullConditional();
            }

            return ToSerial(type, invokeVariable);
        }

        public static ValueExpression ToSerial(this CSharpType type, ValueExpression variable)
        {
            if (!type.IsEnum)
                throw new InvalidOperationException($"Can't call ToSerial on non-enum type {type.Name}");

            if (type.IsStruct) //extensible
            {
                if (type.UnderlyingEnumType.Equals(typeof(string)))
                {
                    return variable.Invoke("ToString");
                }
                else
                {
                    return variable.Invoke($"ToSerial{type.UnderlyingEnumType.Name}", [], null, false, extensionType: type);
                }
            }
            else
            {
                if (type.UnderlyingEnumType.Equals(typeof(int)) ||
                    type.UnderlyingEnumType.Equals(typeof(long)) ||
                    type.UnderlyingEnumType.Equals(typeof(double)) ||
                    type.UnderlyingEnumType.Equals(typeof(float)))
                {
                    return variable.CastTo(type.UnderlyingEnumType);
                }
                else
                {
                    return variable.Invoke($"ToSerial{type.UnderlyingEnumType.Name}", [], null, false, extensionType: type);
                }
            }
        }
    }
}
