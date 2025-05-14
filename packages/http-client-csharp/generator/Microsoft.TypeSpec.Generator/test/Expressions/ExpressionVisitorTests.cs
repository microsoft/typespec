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

        [Test]
        public void CanChangeVariableExpression()
        {
            ValidateVariableExpression("change");
        }

        [Test]
        public void CanUpdateVariableExpression()
        {
            ValidateVariableExpression("update");
        }

        private static void ValidateVariableExpression(string variableName)
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

        [Test]
        public void CanChangeMemberExpression()
        {
            ValidateMemberExpression("ChangeProperty");
        }

        [Test]
        public void CanUpdateMemberExpression()
        {
            ValidateMemberExpression("UpdateProperty");
        }

        private static void ValidateMemberExpression(string memberName)
        {
            MockHelpers.LoadMockGenerator();
            var type = new TestTypeProvider();
            var method = new MethodProvider(
                new MethodSignature("Foo", $"", MethodSignatureModifiers.Public, type.Type, $"", []),
                new MethodBodyStatement[]
                {
                    new MemberExpression(type.Type, memberName).Assign(Literal("foo")).Terminate(),
                },
                type);
            var visitor = new TestLibraryVisitor();
            var updatedMethod = method.Accept(visitor);
            Assert.IsNotNull(updatedMethod);
            Assert.AreEqual("global::Test.TestName.ReplacedProperty = \"foo\";\n", updatedMethod!.BodyStatements!.ToDisplayString());
        }

        [Test]
        public void CanChangeExpressionStatement()
        {
            ValidateExpressionStatement("ChangeProperty");
        }

        [Test]
        public void CanUpdateExpressionStatement()
        {
            ValidateExpressionStatement("UpdateProperty");
        }

        private static void ValidateExpressionStatement(string memberName)
        {
            MockHelpers.LoadMockGenerator();
            var type = new TestTypeProvider();
            var method = new MethodProvider(
                new MethodSignature("Foo", $"", MethodSignatureModifiers.Public, type.Type, $"", []),
                new MethodBodyStatement[]
                {
                    new ExpressionStatement(new MemberExpression(type.Type, memberName).Assign(Literal("foo"))),
                },
                type);
            var visitor = new TestLibraryVisitor();
            var updatedMethod = method.Accept(visitor);
            Assert.IsNotNull(updatedMethod);
            Assert.AreEqual("global::Test.TestName.ReplacedProperty = \"foo\";\n", updatedMethod!.BodyStatements!.ToDisplayString());
        }
        private class TestLibraryVisitor : LibraryVisitor
        {
            protected internal override ValueExpression VisitInvokeMethodExpression(InvokeMethodExpression expression,
                MethodProvider methodProvider)
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

            protected internal override ValueExpression VisitAssignmentExpression(AssignmentExpression expression,
                MethodProvider methodProvider)
            {
                if ((expression.Variable as VariableExpression)?.Declaration.RequestedName == "change")
                {
                    return new AssignmentExpression(
                        new VariableExpression(typeof(string), "replacedVariable"),
                        expression.Value);
                }

                if ((expression.Variable as VariableExpression)?.Declaration.RequestedName == "update")
                {
                    ((VariableExpression)expression.Variable).Update(name: "replacedVariable");
                }

                return expression;
            }

            protected internal override VariableExpression VisitVariableExpression(VariableExpression expression,
                MethodProvider methodProvider)
            {
                if (expression.Declaration.RequestedName == "change")
                {
                    return new VariableExpression(typeof(string), "replacedVariable");
                }

                if (expression.Declaration.RequestedName == "update")
                {
                    expression.Update(name: "replacedVariable");
                }

                return expression;
            }

            protected internal override ValueExpression VisitMemberExpression(MemberExpression expression,
                MethodProvider methodProvider)
            {
                if (expression.MemberName == "ChangeProperty")
                {
                    return new MemberExpression(
                        TypeReferenceExpression.FromType(new TestTypeProvider().Type),
                        "ReplacedProperty");
                }

                if (expression.MemberName == "UpdateProperty")
                {
                    expression.Update(memberName: "ReplacedProperty");
                }

                return expression;
            }

            protected internal override MethodBodyStatement? VisitExpressionStatement(ExpressionStatement statement, MethodProvider method)
            {
                if ((statement.Expression as MemberExpression)?.MemberName == "ChangeProperty")
                {
                    return new ExpressionStatement(new MemberExpression(
                        TypeReferenceExpression.FromType(new TestTypeProvider().Type),
                        "ReplacedProperty").Assign(statement.Expression));
                }

                if ((statement.Expression as MemberExpression)?.MemberName == "UpdateProperty")
                {
                    statement.Update(expression: new MemberExpression(
                        TypeReferenceExpression.FromType(new TestTypeProvider().Type),
                        "ReplacedProperty"));
                }

                return statement;
            }
        }
    }
}
