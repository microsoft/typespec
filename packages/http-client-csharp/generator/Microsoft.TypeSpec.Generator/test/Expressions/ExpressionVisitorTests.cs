// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Expressions
{
    public class ExpressionVisitorTests
    {
        [Test]
        public void CanChangeInvokeMethodExpression()
        {
            ValidateInvokeMethodExpression("ChangeMethod");
        }

        [Test]
        public void CanUpdateInvokeMethodExpression()
        {
            ValidateInvokeMethodExpression("UpdateMethod");
        }

        private static void ValidateInvokeMethodExpression(string methodName)
        {
            MockHelpers.LoadMockGenerator();
            var type = new TestTypeProvider();
            var method = new MethodProvider(
                new MethodSignature("Foo", $"", MethodSignatureModifiers.Public, type.Type, $"", []),
                new MethodBodyStatement[] { Return(new InvokeMethodExpression(This, methodName, [])) },
                type);
            var visitor = new TestLibraryVisitor();
            var updatedMethod = method.Accept(visitor);
            Assert.IsNotNull(updatedMethod);
            Assert.AreEqual("return this.ReplacedMethod();\n", updatedMethod!.BodyStatements!.ToDisplayString());
        }

        [Test]
        public void CanChangeAssignmentExpression()
        {
            ValidateAssignmentExpression("change");
        }

        [Test]
        public void CanUpdateAssignmentExpression()
        {
            ValidateAssignmentExpression("update");
        }

        private static void ValidateAssignmentExpression(string variableName)
        {
            MockHelpers.LoadMockGenerator();
            var type = new TestTypeProvider();
            var method = new MethodProvider(
                new MethodSignature("Foo", $"", MethodSignatureModifiers.Public, type.Type, $"", []),
                new MethodBodyStatement[]
                {
                    new VariableExpression(type.Type, variableName).Assign(Literal("foo")).Terminate(),
                },
                type);
            var visitor = new TestLibraryVisitor();
            var updatedMethod = method.Accept(visitor);
            Assert.IsNotNull(updatedMethod);
            Assert.AreEqual("replacedVariable = \"foo\";\n", updatedMethod!.BodyStatements!.ToDisplayString());
        }

        private class TestLibraryVisitor : LibraryVisitor
        {
            protected internal override ValueExpression VisitInvokeMethodExpression(InvokeMethodExpression expression, MethodProvider methodProvider)
            {
                if (expression.MethodName == "ChangeMethod")
                {
                    return new InvokeMethodExpression(
                        expression.InstanceReference,
                        "ReplacedMethod",
                        expression.Arguments);
                }

                if (expression.MethodName == "UpdateMethod")
                {
                    expression.Update(methodName: "ReplacedMethod");
                    return expression;
                }

                return expression;
            }

            protected internal override ValueExpression VisitAssignmentExpression(AssignmentExpression expression, MethodProvider methodProvider)
            {
                if (((VariableExpression)expression.Variable).Declaration.RequestedName == "change")
                {
                    return new AssignmentExpression(
                        new VariableExpression(typeof(string), "replacedVariable"),
                        expression.Value);
                }

                if (((VariableExpression)expression.Variable).Declaration.RequestedName == "update")
                {
                    ((VariableExpression)expression.Variable).Update(name: "replacedVariable");
                }

                return expression;
            }
        }
    }
}
