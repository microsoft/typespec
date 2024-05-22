// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using static Microsoft.Generator.CSharp.Expressions.Snippets;

namespace Microsoft.Generator.CSharp
{
    public record PropertyDeclaration(FormattableString? Description, MethodSignatureModifiers Modifiers, CSharpType Type, string Name, PropertyBody Body, IReadOnlyDictionary<CSharpType, FormattableString>? Exceptions = null, CSharpType? ExplicitInterface = null, string? OriginalDescription = null)
    {
        /// <summary>
        /// Creates an initialization statement for the property. If a parameter is provided, the initialization statement will create a
        /// parameter reference expression to the parameter.
        /// </summary>
        /// <param name="parameter">The <see cref="Parameter"/> to use as a parameter reference expression.</param>
        public MethodBodyStatement ToInitializationStatement(Parameter? parameter = null)
        {
            List<MethodBodyStatement> methodBodyStatements = new();
            ValueExpression? initializationValue = null;

            if (parameter != null)
            {
                initializationValue = new ParameterReference(parameter);

                if (CSharpType.RequiresToList(parameter.Type, Type))
                {
                    initializationValue = parameter.Type.IsNullable ?
                        Linq.ToList(new NullConditionalExpression(initializationValue)) :
                        Linq.ToList(initializationValue);
                }
            }
            else if (initializationValue == null && Type.IsCollection)
            {
                initializationValue = New.Instance(Type.PropertyInitializationType);
            }

            if (initializationValue != null)
            {
                methodBodyStatements.Add(Assign(new MemberExpression(null, Name), initializationValue));
            }

            return methodBodyStatements;
        }
    }
}
