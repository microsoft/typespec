// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Statements
{
    public class StatementVisitorTests
    {
        [Test]
        public void CanChangeIfElseStatement()
        {
            ValidateIfElseStatement("ChangeIfElseStatement");
        }

        [Test]
        public void CanUpdateIfElseStatement()
        {
            ValidateIfElseStatement("UpdateIfElseStatement");
        }

        private static void ValidateIfElseStatement(string methodName)
        {
            MockHelpers.LoadMockGenerator();
            var type = new TestTypeProvider();
            var method = new MethodProvider(
                new MethodSignature(methodName, $"", MethodSignatureModifiers.Public, typeof(int), $"", []),
                new MethodBodyStatement[]
                {
                    new IfElseStatement(
                        new IfStatement(Bool(new VariableExpression(typeof(string), "foo").Equals(Literal("bar"))))
                        {
                            Return(Literal(2))
                        },
                        new MethodBodyStatement[] { Return(Literal(4)) })
                },
                type);
            var visitor = new TestLibraryVisitor();
            var updatedMethod = method.Accept(visitor);
            Assert.IsNotNull(updatedMethod);
            var actual = updatedMethod!.BodyStatements!.ToDisplayString();
            Assert.AreEqual("if (true)\n{\n    return 10;\n}\nelse\n{\n    return 20;\n}\n", actual);
        }

        [Test]
        public void CanChangeIfStatement()
        {
            ValidateIfStatement("ChangeIfStatement");
        }

        [Test]
        public void CanUpdateIfStatement()
        {
            ValidateIfStatement("UpdateIfStatement");
        }

        private static void ValidateIfStatement(string methodName)
        {
            MockHelpers.LoadMockGenerator();
            var type = new TestTypeProvider();
            var method = new MethodProvider(
                new MethodSignature(methodName, $"", MethodSignatureModifiers.Public, typeof(int), $"", []),
                new MethodBodyStatement[]
                {
                    new IfStatement(Bool(new VariableExpression(typeof(string), "foo").Equals(Literal("bar"))))
                    {
                        Return(Literal(2))
                    },
                },
                type);
            var visitor = new TestLibraryVisitor();
            var updatedMethod = method.Accept(visitor);
            Assert.IsNotNull(updatedMethod);
            var actual = updatedMethod!.BodyStatements!.ToDisplayString();
            Assert.AreEqual("if (true)\n{\n    return 10;\n}\n", actual);
        }

        [Test]
        public void CanChangeForStatement()
        {
            ValidateForStatement("ChangeForStatement");
        }

        [Test]
        public void CanUpdateForStatement()
        {
            ValidateForStatement("UpdateForStatement");
        }

        private static void ValidateForStatement(string methodName)
        {
            MockHelpers.LoadMockGenerator();
            var type = new TestTypeProvider();

            var declaration = new DeclarationExpression(typeof(int), "index");
            var variable = declaration.Variable;
            var assignment = new AssignmentExpression(declaration, Literal(0));
            var condition = new BinaryOperatorExpression("<", variable, Literal(10));
            var increment = new UnaryOperatorExpression("++", variable, true);
            var forStatement = new ForStatement(assignment, condition, increment);
            var method = new MethodProvider(
                new MethodSignature(methodName, $"", MethodSignatureModifiers.Public, typeof(int), $"", []),
                new MethodBodyStatement[]
                {
                    forStatement
                },
                type);
            var visitor = new TestLibraryVisitor();
            var updatedMethod = method.Accept(visitor);
            Assert.IsNotNull(updatedMethod);
            var actual = updatedMethod!.BodyStatements!.ToDisplayString();
            Assert.AreEqual("for (int index = 0; (index < 20); index++)\n{\n}\n", actual);
        }

        [Test]
        public void CanChangeWhileStatement()
        {
            ValidateWhileStatement("ChangeWhileStatement");
        }

        [Test]
        public void CanUpdateWhileStatement()
        {
            ValidateWhileStatement("UpdateWhileStatement");
        }

        private static void ValidateWhileStatement(string methodName)
        {
            MockHelpers.LoadMockGenerator();
            var type = new TestTypeProvider();

            var whileStatement = new WhileStatement(Bool(false)) { Break };
            var method = new MethodProvider(
                new MethodSignature(methodName, $"", MethodSignatureModifiers.Public, typeof(int), $"", []),
                new MethodBodyStatement[]
                {
                    whileStatement
                },
                type);
            var visitor = new TestLibraryVisitor();
            var updatedMethod = method.Accept(visitor);
            Assert.IsNotNull(updatedMethod);
            var actual = updatedMethod!.BodyStatements!.ToDisplayString();
            Assert.AreEqual("while (true)\n{\n    return 10;\n}\n", actual);
        }

        [Test]
        public void CanChangeSwitchStatement()
        {
            ValidateSwitchStatement("ChangeSwitchStatement");
        }

        [Test]
        public void CanUpdateSwitchStatement()
        {
            ValidateSwitchStatement("UpdateSwitchStatement");
        }

        private static void ValidateSwitchStatement(string methodName)
        {
            MockHelpers.LoadMockGenerator();
            var type = new TestTypeProvider();

            var switchStatement = new SwitchStatement(new VariableExpression(typeof(string), "foo"));
            var method = new MethodProvider(
                new MethodSignature(methodName, $"", MethodSignatureModifiers.Public, typeof(int), $"", []),
                new MethodBodyStatement[]
                {
                    switchStatement
                },
                type);
            var visitor = new TestLibraryVisitor();
            var updatedMethod = method.Accept(visitor);
            Assert.IsNotNull(updatedMethod);
            var actual = updatedMethod!.BodyStatements!.ToDisplayString();
            Assert.AreEqual("switch (updatedVar)\n{\n    case 100:\n        return true;\n    case 200:\n        return false;\n}\n", actual);
        }

        private class TestLibraryVisitor : LibraryVisitor
        {
            protected internal override MethodBodyStatement VisitIfElseStatement(
                IfElseStatement statement,
                MethodProvider methodProvider)
            {
                if (methodProvider.Signature.Name == "ChangeIfElseStatement")
                {
                    return new IfElseStatement(
                        Literal(true),
                        Return(Literal(10)),
                        Return(Literal(20)));
                }

                if (methodProvider.Signature.Name == "UpdateIfElseStatement")
                {
                    statement.Update(
                        ifStatement: new IfStatement(Literal(true))
                        {
                            Return(Literal(10))
                        },
                        elseStatement: new MethodBodyStatement[]
                        {
                            Return(Literal(20))
                        });
                    return statement;
                }

                return statement;
            }

            protected internal override MethodBodyStatement VisitIfStatement(
                IfStatement statement,
                MethodProvider methodProvider)
            {
                if (methodProvider.Signature.Name == "ChangeIfStatement")
                {
                    return new IfStatement(
                        Literal(true))
                        {
                            Return(Literal(10))
                        };
                }
                if (methodProvider.Signature.Name == "UpdateIfStatement")
                {
                    statement.Update(
                        condition: Literal(true),
                        body: new MethodBodyStatement[]
                        {
                            Return(Literal(10))
                        });
                    return statement;
                }

                return statement;
            }

            protected internal override MethodBodyStatement VisitForStatement(
                ForStatement statement,
                MethodProvider methodProvider)
            {
                var variable = ((DeclarationExpression)((AssignmentExpression)statement.IndexExpression!).Variable).Variable;
                if (methodProvider.Signature.Name == "ChangeForStatement")
                {
                    return new ForStatement(
                        statement.IndexExpression,
                        new BinaryOperatorExpression("<", variable, Literal(20)),
                        statement.IncrementExpression);
                }

                if (methodProvider.Signature.Name == "UpdateForStatement")
                {
                    statement.Update(condition: new BinaryOperatorExpression("<", variable, Literal(20)));
                    return statement;
                }

                return statement;
            }

            protected internal override MethodBodyStatement VisitWhileStatement(
                WhileStatement statement,
                MethodProvider methodProvider)
            {
                if (methodProvider.Signature.Name == "ChangeWhileStatement")
                {
                    return new WhileStatement(
                        Bool(true))
                        {
                            Return(Literal(10))
                        };
                }

                if (methodProvider.Signature.Name == "UpdateWhileStatement")
                {
                    statement.Update(
                        condition: Bool(true),
                        body: new MethodBodyStatement[]
                        {
                            Return(Literal(10))
                        });
                }

                return statement;
            }

            protected internal override MethodBodyStatement VisitSwitchStatement(
                SwitchStatement statement,
                MethodProvider methodProvider)
            {
                if (methodProvider.Signature.Name == "ChangeSwitchStatement")
                {
                    return new SwitchStatement(
                        new VariableExpression(typeof(bool), "updatedVar"),
                        new SwitchCaseStatement[]
                        {
                            new SwitchCaseStatement(
                                Literal(100),
                                Return(True)),
                            new SwitchCaseStatement(
                                Literal(200),
                                Return(False))
                        });
                }

                if (methodProvider.Signature.Name == "UpdateSwitchStatement")
                {
                    statement.Update(
                        matchExpression: new VariableExpression(typeof(bool), "updatedVar"),
                        cases: [new SwitchCaseStatement(
                            Literal(100),
                            Return(True)),
                        new SwitchCaseStatement(
                            Literal(200),
                            Return(False))]);
                }

                return statement;
            }
        }
    }
}
