// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp
{
    public static class TestHelpers
    {
        /// <summary>
        /// Determines whether the given statement is or contains an expression statement which is equal to the given code string.
        /// </summary>
        /// <param name="statement"> <c cref="MethodBodyStatement">MethodBodyStatement</c> to check. </param>
        /// <param name="code"> Code string which the expression statement should be transformed to. </param>
        /// <returns> True if there is an <c cref="ExpressionStatement">ExpressionStatement</c> matching the given code string. </returns>
        public static bool HasExpressionStatement(MethodBodyStatement? statement, string code) => HasMethodBodyStatement(statement, s => s is ExpressionStatement && GetCode(s) == code);
        private static bool HasMethodBodyStatement(MethodBodyStatement? statement, Func<MethodBodyStatement, bool> predicate) => statement switch
        {
            null => false,
            MethodBodyStatements statements => statements.Statements.Any(s => HasMethodBodyStatement(s, predicate)),
            _ => predicate(statement)
        };

        private static string GetCode(MethodBodyStatement statement)
        {
            using CodeWriter writer = new CodeWriter();
            statement.Write(writer);
            return writer.ToString(false);
        }

        /// <summary>
        /// Get the generated code string of the given <c cref="ValueExpression">ValueExpression</c>.
        /// </summary>
        /// <param name="expression"> The target <c cref="ValueExpression">ValueExpression</c> </param>
        /// <returns> Corresponding code string of the <c cref="ValueExpression">ValueExpression</c> </returns>
        public static string GetCode(ValueExpression expression)
        {
            using CodeWriter writer = new CodeWriter();
            expression.Write(writer);
            return writer.ToString(false);
        }
    };
}
