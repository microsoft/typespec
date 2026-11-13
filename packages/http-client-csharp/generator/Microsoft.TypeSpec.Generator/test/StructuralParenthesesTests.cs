// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Operations;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        [TestCase("condition", "if (x == y)")]
        [TestCase("return", "return x == y;")]
        [TestCase("arrow", "=> x == y;")]
        [TestCase("local", "value = x + y;")]
        [TestCase("leftAssociation", "=> x - y - z;")]
        [TestCase("higherPrecedence", "=> x + y * z;")]
        [TestCase("coalesceRight", "=> x ?? y ?? z;")]
        [TestCase("argument", "Echo(x + y)")]
        public async Task StructuralParenthesesNonReassociatingCasesKeepOperations(string kind, string expected)
        {
            var member = kind switch
            {
                "condition" => "public bool M(int x, int y) { if (((x == y))) return true; return false; }",
                "return" => "public bool M(int x, int y) { return ((x == y)); }",
                "arrow" => "public bool M(int x, int y) => ((x == y));",
                "local" => "public int M(int x, int y) { var value = ((x + y)); return value; }",
                "leftAssociation" => "public int M(int x, int y, int z) => (x - y) - z;",
                "higherPrecedence" => "public int M(int x, int y, int z) => x + (y * z);",
                "coalesceRight" => "public string M(string x, string y, string z) => x ?? (y ?? z);",
                _ => "public int M(int x, int y) => Echo((x + y)); private int Echo(int value) => value;"
            };
            var code = ParenthesesCode(member);
            var output = await Reduce(code);
            StringAssert.Contains(expected, output);
            AssertParenthesesOperations(code.Content, output);
            AssertBoundaryTriviaIdentity(code.Content, output);
        }

        [TestCase("rightAssociation", "x - (y - z)")]
        [TestCase("integerReassociation", "x + (y + z)")]
        [TestCase("floatingReassociation", "x + (y + z)")]
        [TestCase("checkedReassociation", "x + (y + z)")]
        [TestCase("plusFusion", "x+(+y)")]
        [TestCase("conditionalAccess", "(value?.Trim()).Length")]
        [TestCase("genericAmbiguity", "Echo((a < b), (c > d))")]
        [TestCase("optionalDefault", "value = (1)")]
        [TestCase("interpolation", "{(flag ? 1 : 2)}")]
        [TestCase("stackalloc", "(stackalloc byte[8])")]
        public async Task StructuralParenthesesUncertainGrammarAndReassociationRemain(string kind, string expected)
        {
            var member = kind switch
            {
                "rightAssociation" => "public int M(int x, int y, int z) => x - (y - z);",
                "integerReassociation" => "public int M(int x, int y, int z) => x + (y + z);",
                "floatingReassociation" => "public double M(double x, double y, double z) => x + (y + z);",
                "checkedReassociation" => "public int M(int x, int y, int z) => checked(x + (y + z));",
                "plusFusion" => "public int M(int x, int y) => x+(+y);",
                "conditionalAccess" => "public int M(string value) => (value?.Trim()).Length;",
                "genericAmbiguity" => "public bool M(int a, int b, int c, int d) => Echo((a < b), (c > d)); private bool Echo(bool x, bool y) => x && y;",
                "optionalDefault" => "public int M(int value = (1)) => value;",
                "interpolation" => "public string M(bool flag) => $\"value:{(flag ? 1 : 2)}\";",
                _ => "public int M() { System.Span<byte> value = (stackalloc byte[8]); return value.Length; }"
            };
            var code = ParenthesesCode(member);
            var output = await Reduce(code);
            StringAssert.Contains(expected, output);
            AssertParenthesesOperations(code.Content, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StructuralParenthesesCapturedSourceAndExplicitOverride(bool explicitText)
        {
            var member = "public object M(int x, int y) => Capture((x + y)" + (explicitText ? ", \"manual\"" : "") + "); private object Capture(object value, [System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")] string text = \"\") => text;";
            var code = ParenthesesCode(member);
            var output = await Reduce(code);
            StringAssert.Contains(explicitText ? "Capture(x + y, \"manual\")" : "Capture((x + y))", output);
            AssertParenthesesOperations(code.Content, output);
        }

        [TestCase("\n")]
        [TestCase("\r\n")]
        public async Task StructuralParenthesesPreservesCommentsAndPhysicalLines(string ending)
        {
            var member = "public int M(int x, int y) { return ( /* before */ (" + ending + "x + y" + ending + ") /* after */ ); }";
            var code = ParenthesesCode(member);
            var output = await Reduce(code);
            var tree = CSharpSyntaxTree.ParseText(output);
            Assert.That(tree.GetRoot().DescendantNodes().OfType<ReturnStatementSyntax>().Single().Expression, Is.Not.TypeOf<ParenthesizedExpressionSyntax>());
            AssertBoundaryTriviaIdentity(code.Content, output);
            AssertParenthesesOperations(code.Content, output);
        }

        [Test]
        public async Task StructuralParenthesesWorksWithoutRecordedTypeReferences()
        {
            const string source = "namespace Sample { public class Clock { public bool M(int x, int y) => ((x == y)); } }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("=> x == y;", output);
            AssertParenthesesOperations(source, output);
        }

        [Test]
        public async Task StructuralParenthesesRetainsCastOperandAndSeparatesKeywordTokens()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock {");
                writer.WriteLine($"public object M(object value) => ({typeof(Exception)})(value);");
                writer.WriteRawLine("public int N(int x, int y) { return((x + y)); } } }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("(Exception)(value)", output);
            StringAssert.Contains("return(", output);
            AssertParenthesesOperations(code.Content, output);
        }

        [Test]
        public void StructuralParenthesesOracleDetectsChangedParenthesizedArrowOperator()
        {
            const string before = "class Clock { int M(int x, int y) => ((x - y)); }";
            const string after = "class Clock { int M(int x, int y) => ((x + y)); }";
            Assert.Throws<AssertionException>(() => AssertParenthesesOperations(before, after));
        }

        [Test]
        public void StructuralParenthesesOracleIgnoresOnlyExplicitArgumentSyntaxRepresentation()
        {
            const string before = "class Clock { int M(int x, int y) => Echo((x + y)); int Echo(int value) => value; }";
            const string after = "class Clock { int M(int x, int y) => Echo(x + y); int Echo(int value) => value; }";
            AssertParenthesesOperations(before, after);
        }

        [Test]
        public void StructuralParenthesesOracleDetectsChangedAssociation()
        {
            const string before = "class Clock { int M(int x, int y, int z) { return x - (y - z); } }";
            const string after = "class Clock { int M(int x, int y, int z) { return (x - y) - z; } }";
            Assert.Throws<AssertionException>(() => AssertParenthesesOperations(before, after));
        }

        [Test]
        public void StructuralParenthesesOracleDetectsChangedCapturedConstant()
        {
            const string prefix = "class Clock { object M(int x, int y) => Capture(";
            const string suffix = "); object Capture(object value, [System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")] string text = \"\") => text; }";
            // Roslyn strips outer argument parentheses when synthesizing CAE text.
            // These equivalent typeof values instead have genuinely different text.
            Assert.Throws<AssertionException>(() => AssertParenthesesOperations(prefix + "typeof(global::System.Int32)" + suffix, prefix + "typeof(int)" + suffix));
        }

        private static CodeFile ParenthesesCode(string member) => Recorded(writer =>
        {
            writer.WriteRawLine("namespace Sample { public class Clock {");
            writer.WriteLine($"public {typeof(DateTimeOffset)} Seed => default;");
            writer.WriteRawLine(member);
            writer.WriteRawLine("} }");
        });

        private static void AssertParenthesesOperations(string before, string after, bool normalizeThisReceiver = false, CSharpParseOptions? parseOptions = null)
        {
            static string Member(ISymbol? symbol) => symbol == null ? "" : symbol.OriginalDefinition.GetDocumentationCommentId() + ":" +
                StructuralTypeNameRuleOracleTests.TypeIdentity(symbol.ContainingType) + ":" + (symbol is IMethodSymbol method
                    ? string.Join(",", method.TypeArguments.Select(StructuralTypeNameRuleOracleTests.TypeIdentity)) : "");
            static string Conversion(Microsoft.CodeAnalysis.Operations.CommonConversion conversion) => conversion.Exists + ":" + conversion.IsIdentity + ":" +
                conversion.IsNumeric + ":" + conversion.IsReference + ":" + conversion.IsUserDefined + ":" + Member(conversion.MethodSymbol);
            string Fingerprint(IOperation operation)
            {
                if (operation is IParenthesizedOperation parenthesized) return Fingerprint(parenthesized.Operand);
                var detail = operation switch
                {
                    IBinaryOperation binary => binary.OperatorKind + ":" + binary.IsChecked + ":" + binary.IsLifted + ":" + Member(binary.OperatorMethod),
                    IUnaryOperation unary => unary.OperatorKind + ":" + unary.IsChecked + ":" + unary.IsLifted + ":" + Member(unary.OperatorMethod),
                    IConversionOperation conversion => conversion.IsChecked + ":" + conversion.IsTryCast + ":" + conversion.Conversion.IsIdentity + ":" + Member(conversion.OperatorMethod),
                    IInvocationOperation invocation => Member(invocation.TargetMethod),
                    ITypeOfOperation typeOf => StructuralTypeNameRuleOracleTests.TypeIdentity(typeOf.TypeOperand),
                    IArgumentOperation argument => argument.Parameter?.Ordinal + ":" + argument.Parameter?.RefKind + ":" + argument.ArgumentKind + ":" +
                        Conversion(argument.InConversion) + ":" + Conversion(argument.OutConversion),
                    IFieldReferenceOperation field => Member(field.Field),
                    IPropertyReferenceOperation property => Member(property.Property),
                    IParameterReferenceOperation parameter => parameter.Parameter.Ordinal + ":" + parameter.Parameter.Name,
                    ILocalReferenceOperation local => local.Local.Name,
                    IInstanceReferenceOperation instance => instance.ReferenceKind.ToString(),
                    _ => ""
                };
                var constant = operation.ConstantValue.HasValue ? (operation.ConstantValue.Value?.GetType().FullName ?? "null") + ":" +
                    Convert.ToString(operation.ConstantValue.Value, System.Globalization.CultureInfo.InvariantCulture) : "<none>";
                // Roslyn can report explicit source arguments implicit when their
                // syntax is parenthesized. ArgumentKind/conversions/constant values,
                // rather than this representation flag, prove argument semantics.
                var implicitFlag = operation is IArgumentOperation { ArgumentKind: ArgumentKind.Explicit } ||
                    normalizeThisReceiver && operation is IInstanceReferenceOperation { ReferenceKind: InstanceReferenceKind.ContainingTypeInstance }
                    ? false : operation.IsImplicit;
                return operation.Kind + ":" + StructuralTypeNameRuleOracleTests.TypeIdentity(operation.Type) + ":" + implicitFlag + ":" + constant + ":" + detail +
                    "[" + string.Join("|", operation.ChildOperations.Select(Fingerprint)) + "]";
            }
            string[] Snapshot(string source)
            {
                var tree = CSharpSyntaxTree.ParseText(source, parseOptions);
                var compilation = CSharpCompilation.Create("ParenthesesOperationOracle", new[] { tree }, References,
                    new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
                Assert.That(compilation.GetDiagnostics().Where(static diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty);
                var model = compilation.GetSemanticModel(tree);
                return tree.GetRoot().DescendantNodes().OfType<MethodDeclarationSyntax>().Select(method =>
                    model.GetOperation(method) ?? throw new InvalidOperationException("Method operation missing: " + method.Identifier.ValueText))
                    .Select(Fingerprint).ToArray();
            }
            Assert.That(Snapshot(after), Is.EqualTo(Snapshot(before)), "Normalized operation trees, conversions, calls and constants must remain identical");
        }
    }
}
