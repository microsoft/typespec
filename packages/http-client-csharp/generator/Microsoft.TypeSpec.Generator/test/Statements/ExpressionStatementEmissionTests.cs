// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Snippets;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Statements
{
    [NonParallelizable]
    public class ExpressionStatementEmissionTests
    {
        private static readonly MetadataReference[] References = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!)
            .Split(Path.PathSeparator).Select(static path => MetadataReference.CreateFromFile(path)).ToArray();

        [TestCase("=")]
        [TestCase("+=")]
        [TestCase("-=")]
        [TestCase("*=")]
        [TestCase("/=")]
        [TestCase("%=")]
        [TestCase("&=")]
        [TestCase("|=")]
        [TestCase("^=")]
        [TestCase("<<=")]
        [TestCase(">>=")]
        [TestCase(">>>=")]
        [TestCase("??=")]
        public void AssignmentStatementCompilesWithoutSimplification(string operation)
        {
            MockHelpers.LoadMockGenerator();
            var variable = new VariableExpression(typeof(int), "bytesConsumed");
            var delta = new BinaryOperatorExpression("-", new VariableExpression(typeof(int), "jsonPathLength"), new VariableExpression(typeof(int), "localLength"));
            using var writer = new CodeWriter();
            writer.AppendRaw("public static class C { public static int M(int jsonPathLength, int localLength) {");
            writer.AppendRaw(operation == "??=" ? "int? bytesConsumed = 0;" : "int bytesConsumed = 0;");
            new ExpressionStatement(new BinaryOperatorExpression(operation, variable, delta)).Write(writer);
            writer.AppendRaw(operation == "??=" ? "return bytesConsumed.Value; } }" : "return bytesConsumed; } }");
            var text = writer.ToString(false);
            var compilation = CSharpCompilation.Create("RawAssignment", [CSharpSyntaxTree.ParseText(text)], References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.That(compilation.GetDiagnostics().Where(static d => d.Severity == DiagnosticSeverity.Error), Is.Empty, text);
        }

        [Test]
        public void AddAndAssignHelperCompilesWithoutSimplification()
        {
            MockHelpers.LoadMockGenerator();
            var bytesConsumed = new VariableExpression(typeof(int), "bytesConsumed").As<int>();
            var jsonPathLength = new VariableExpression(typeof(int), "jsonPathLength");
            var localLength = new VariableExpression(typeof(int), "localLength");
            using var writer = new CodeWriter();
            writer.AppendRaw("public static class C { public static int M(int bytesConsumed, int jsonPathLength, int localLength) {");
            // Faithful Sample producer: AddAndAssign wraps the assignment in ScopedApi<int>.
            bytesConsumed.AddAndAssign(jsonPathLength.As<int>().Minus(localLength.As<int>())).Write(writer);
            writer.AppendRaw("return bytesConsumed; } }");
            var text = writer.ToString(false);
            var compilation = CSharpCompilation.Create("ActualAssignmentHelper", [CSharpSyntaxTree.ParseText(text)], References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.That(compilation.GetDiagnostics().Where(static d => d.Severity == DiagnosticSeverity.Error), Is.Empty, text);
        }

        [Test]
        public void MultipleTransparentWrappersKeepStatementAssignmentLegal()
        {
            using var writer = new CodeWriter();
            var value = new VariableExpression(typeof(int), "value");
            var wrapped = new BinaryOperatorExpression("+=", value, value).As<int>().As<long>();
            new ExpressionStatement(wrapped).Write(writer);
            Assert.AreEqual("value += value;\n", writer.ToString(false));
        }

        [TestCase(true, "(left + right)")]
        [TestCase(false, "left + right")]
        public void ExplicitBinaryParenthesesOptionIsPreserved(bool addParentheses, string expected)
        {
            using var writer = new CodeWriter();
            new BinaryOperatorExpression("+", new VariableExpression(typeof(int), "left"), new VariableExpression(typeof(int), "right"), addParentheses).Write(writer);
            Assert.AreEqual(expected, writer.ToString(false));
        }

        [TestCase(true)]
        [TestCase(false)]
        public void StatementAssignmentRemainsLegalWithEitherParenthesesOption(bool addParentheses)
        {
            using var writer = new CodeWriter();
            var value = new VariableExpression(typeof(int), "value");
            new ExpressionStatement(new BinaryOperatorExpression("+=", value, value, addParentheses)).Write(writer);
            Assert.AreEqual("value += value;\n", writer.ToString(false));
        }

        [Test]
        public void AssignmentInsideAnExpressionRetainsParentheses()
        {
            using var writer = new CodeWriter();
            var value = new VariableExpression(typeof(int), "value");
            var assignment = new BinaryOperatorExpression("+=", value, value);
            new BinaryOperatorExpression("*", assignment, value).Write(writer);
            Assert.AreEqual("((value += value) * value)", writer.ToString(false));
        }
    }
}
