// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Snippets
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

        public static ValueExpression Deserialize(this CSharpType type, ValueExpression element, ValueExpression? options = null)
        {
            var arguments = options == null ? new[] { element } : new[] { element, options };
            return Static(type).Invoke($"Deserialize{type.Name}", arguments);
        }

        public static ValueExpression ToSerial(this CSharpType type, ParameterProvider param)
        {
            if (!type.IsEnum)
                throw new InvalidOperationException($"Can't call ToSerial on non-enum type {type.Name}");

            ValueExpression variable = param.Field is null ? param : param.Field;

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
                if (type.UnderlyingEnumType.Equals(typeof(int)) || type.UnderlyingEnumType.Equals(typeof(long)))
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
