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
        [Test]
        public async Task NamespaceRolesIncludeOperatorAndConversionTypes()
        {
            var clock = new CSharpType("Clock", "Sample", false, false, null, Array.Empty<CSharpType>(), true, false);
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock {");
                writer.WriteLine($"public static {clock} operator +(Clock left, Clock right) => left;");
                writer.WriteLine($"public static explicit operator {typeof(DateTimeOffset)}(Clock value) => default;");
                writer.WriteRawLine("} }");
            });
            var output = await ReduceRole(code);
            StringAssert.Contains("static Clock operator +", output);
            StringAssert.Contains("operator DateTimeOffset(Clock", output);
            StringAssert.DoesNotContain("global::", output);
        }

        [Test]
        public async Task NamespaceRolesIncludeRefAndTupleTypeSlots()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock {");
                writer.WriteLine($"private static {typeof(DateTimeOffset)} _stamp;");
                writer.WriteLine($"public ref {typeof(DateTimeOffset)} Value => ref _stamp;");
                writer.WriteLine($"public ({typeof(DateTimeOffset)} Stamp, {typeof(TimeSpan)} Duration) Pair => default;");
                writer.WriteRawLine("} }");
            });
            var output = await ReduceRole(code);
            StringAssert.Contains("ref DateTimeOffset Value", output);
            StringAssert.Contains("(DateTimeOffset Stamp, TimeSpan Duration)", output);
            StringAssert.DoesNotContain("global::", output);
        }

        [Test]
        public async Task NamespaceRolesIncludeFunctionPointerTypeSlots()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public unsafe class Clock {");
                writer.WriteLine($"public delegate*<{typeof(DateTimeOffset)}, {typeof(TimeSpan)}> Pointer;");
                writer.WriteRawLine("} }");
            });
            var output = await ReduceRole(code, allowUnsafe: true);
            StringAssert.Contains("delegate*<DateTimeOffset, TimeSpan>", output);
            StringAssert.DoesNotContain("global::", output);
        }

        [Test]
        public async Task NamespaceRolesIncludeForeachAndUnambiguousPatterns()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock { public void M(object value, System.Collections.Generic.IEnumerable<System.DateTimeOffset> values) {");
                writer.WriteLine($"foreach ({typeof(DateTimeOffset)} stamp in values) {{ }}");
                writer.WriteLine($"if (value is {typeof(DateTimeOffset)} matched) {{ }}");
                writer.WriteLine($"if (value is {typeof(DateTimeOffset)} {{ Year: 2020 }}) {{ }}");
                writer.WriteRawLine("} } }");
            });
            var output = await ReduceRole(code);
            StringAssert.Contains("foreach (DateTimeOffset stamp", output);
            StringAssert.Contains("is DateTimeOffset matched", output);
            StringAssert.Contains("is DateTimeOffset { Year", output);
            StringAssert.DoesNotContain("global::System.DateTimeOffset", output);
        }

        [Test]
        public async Task NamespaceRolesIncludeAsTypeOperands()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock {");
                writer.WriteLine($"public object M(object value) => value as {typeof(Exception)};");
                writer.WriteRawLine("} }");
            });
            var output = await ReduceRole(code);
            StringAssert.Contains("value as Exception", output);
            StringAssert.DoesNotContain("global::", output);
        }

        [Test]
        public async Task NamespaceRolesIncludeSizeofAndStackallocTypes()
        {
            var point = new CSharpType("Point", "Sample", true, false, null, Array.Empty<CSharpType>(), true, true);
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public struct Point { public int X; } public unsafe class Clock {");
                writer.WriteLine($"public int Size() => sizeof({point});");
                writer.WriteLine($"public void Allocate() {{ var buffer = stackalloc {point}[1]; }}");
                writer.WriteRawLine("} }");
            });
            var output = await ReduceRole(code, allowUnsafe: true);
            var tree = CSharpSyntaxTree.ParseText(code.Content);
            var name = tree.GetRoot().DescendantNodes().OfType<QualifiedNameSyntax>().Single(static node => node.Parent is ArrayTypeSyntax);
            Assert.True(SyntaxFacts.IsInTypeOnlyContext(name));
            Assert.False(SyntaxFacts.IsInTypeOnlyContext((ExpressionSyntax)name.Parent!), "Classifier expects the original named slot, not its promoted stackalloc wrapper");
            StringAssert.Contains("sizeof(Point)", output);
            StringAssert.Contains("stackalloc Point[1]", output);
            StringAssert.DoesNotContain("global::", output);
        }

        [Test]
        public async Task NamespaceRolesIncludePrimaryConstructorBases()
        {
            var baseType = new CSharpType("Base", "Sample", false, false, null, Array.Empty<CSharpType>(), true, false);
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Base(int value) { }");
                writer.WriteLine($"public class Clock(int value) : {baseType}(value) {{ }}");
                writer.WriteRawLine("}");
            });
            var output = await ReduceRole(code);
            StringAssert.Contains(": Base(value)", output);
            StringAssert.DoesNotContain("global::", output);
        }

        [Test]
        public async Task NamespaceRolesIncludeExplicitInterfaceSpecifiers()
        {
            var iface = new CSharpType("IWidget", "Sample", false, false, null, Array.Empty<CSharpType>(), true, false);
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public interface IWidget { void M(); int P { get; } } public class Clock : IWidget {");
                writer.WriteLine($"void {iface}.M() {{ }}");
                writer.WriteLine($"int {iface}.P => 0;");
                writer.WriteRawLine("} }");
            });
            var output = await ReduceRole(code);
            StringAssert.Contains("void IWidget.M()", output);
            StringAssert.Contains("int IWidget.P", output);
            StringAssert.DoesNotContain("global::", output);
        }

        [Test]
        public async Task NamespaceRolesIncludeExplicitLambdaReturnTypes()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock { public object M() {");
                writer.WriteLine($"System.Func<System.Exception> make = {typeof(Exception)} () => new System.Exception();");
                writer.WriteRawLine("return make; } } }");
            });
            var output = await ReduceRole(code);
            StringAssert.Contains("make = Exception () =>", output);
            StringAssert.DoesNotContain("global::", output);
        }

        [Test]
        public async Task AmbiguousBarePatternAndUnprotectedCastKeepTheirGuards()
        {
            var marker = new CSharpType("Marker", "Sample", false, false, null, Array.Empty<CSharpType>(), true, false);
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Marker {} public class Clock { public bool M(object value) { const int Marker = 0;");
                writer.WriteLine($"return value is {marker};");
                writer.WriteRawLine("}");
                writer.WriteLine($"public object Cast(object value) => ({marker})value;");
                writer.WriteRawLine("} }");
            });
            var output = await ReduceRole(code);
            StringAssert.Contains("is global::Sample.Marker", output);
            StringAssert.Contains("(global::Sample.Marker)value", output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task ExplicitInterfaceScopeDoesNotShareMethodTypeParameterFacts(bool returnFirst)
        {
            var iface = new CSharpType("I", "N", false, false, null, Array.Empty<CSharpType>(), true, false);
            var code = Recorded(writer =>
            {
                writer.WriteRawLine(returnFirst ? "namespace N { public interface I { global::N.I M<I>(I value); } }" : "namespace N { public interface I { void M<I>(I value); } }");
                writer.WriteRawLine("namespace Sample { public class Clock : N.I {");
                if (returnFirst)
                {
                    writer.WriteLine($"{iface} {iface}.M<I>(I value) {{");
                }
                else
                {
                    writer.WriteLine($"void {iface}.M<I>(I value) {{");
                }

                writer.WriteLine($"{iface} other = null;");
                writer.WriteRawLine(returnFirst ? "return other; } } }" : "} } }");
            });
            var output = await ReduceRole(code);
            StringAssert.Contains("I.M<I>(I value)", output);
            StringAssert.DoesNotContain("global::N.I.M", output);
            StringAssert.Contains("N.I other", output);
            if (returnFirst)
            {
                StringAssert.Contains("N.I I.M", output);
            }
        }

        [Test]
        public async Task DeclarationPatternContextualIdentifierKeepsTypeGrammarAfterSerialization()
        {
            var marker = new CSharpType("var", "N", false, false, null, Array.Empty<CSharpType>(), true, false);
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace N { public class var {} } namespace Sample { public class Clock { public bool M(object value) {");
                writer.WriteLine($"return value is {marker} captured;");
                writer.WriteRawLine("} } }");
            });
            var output = await ReduceRole(code);
            StringAssert.Contains("is @var captured", output);
            StringAssert.DoesNotContain("global::", output);
        }

        [Test]
        public async Task WrapperNormalizationPreservesProtectedAndUnprotectedCastPolicies()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock {");
                writer.WriteLine($"public object Protected(object value) => ({typeof(Exception)}[])(value);");
                writer.WriteLine($"public object Array(object value) => ({typeof(Exception)}[])value;");
                writer.WriteLine($"public object Nullable(object value) => ({typeof(DateTimeOffset)}?)value;");
                writer.WriteRawLine("} }");
            });
            var output = await ReduceRole(code);
            StringAssert.Contains("(Exception[])(value)", output);
            StringAssert.Contains("(global::System.Exception[])value", output);
            StringAssert.Contains("(global::System.DateTimeOffset?)value", output);
            AssertOperationBindings(code.Content, output);
        }

        [Test]
        public async Task LambdaRoleInsideCapturedArgumentRemainsExactAfterWarmDecision()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System; using System.Runtime.CompilerServices; namespace Sample { public class Clock { public object M() {");
                writer.WriteLine($"Func<Exception> outside = {typeof(Exception)} () => new Exception();");
                writer.WriteLine($"return Capture({typeof(Exception)} () => new Exception());");
                writer.WriteRawLine("} private object Capture(Func<Exception> make, [CallerArgumentExpression(\"make\")] string text = \"\") => text; } }");
            });
            var output = await ReduceRole(code);
            StringAssert.Contains("outside = Exception () =>", output);
            StringAssert.Contains("Capture(global::System.Exception () =>", output);
            AssertOperationBindings(code.Content, output);
        }

        [TestCase("using System; class C { public static explicit operator DateTimeOffset(C value) => default; }", "DateTimeOffset", "TimeSpan", false)]
        [TestCase("unsafe class C { public delegate*<System.DateTimeOffset, void> P; }", "DateTimeOffset", "TimeSpan", true)]
        [TestCase("interface I { void M(); } interface J { void M(); } class C : I, J { public void M() {} void I.M() {} }", "void I.M", "void J.M", false)]
        public void RoleOracleRejectsChangedReturnPointerOrInterface(string source, string before, string after, bool allowUnsafe)
        {
            Assert.Throws<AssertionException>(() => AssertRoleBindings(source, source.Replace(before, after), allowUnsafe));
        }

        [Test]
        public void RoleOracleRejectsTypePatternBecomingAConstantPattern()
        {
            const string source = "namespace N { public class T {} } class C { const int T = 0; bool M(object value) => value is global::N.T; }";
            Assert.Throws<AssertionException>(() => AssertRoleBindings(source, source.Replace("global::N.T", "T"), false));
        }

        [TestCase(0)]
        [TestCase(1)]
        [TestCase(2)]
        [TestCase(3)]
        [TestCase(4)]
        [TestCase(5)]
        public async Task AliasQualifiedOuterTypeCannotBypassPolicyAfterWarmLookup(int kind)
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System.Linq; using System.Collections.Generic; public class Box<T> {} public class Outer<T> { public class Inner {} } namespace Sample { public class Clock { public object M(object value, IEnumerable<Box<System.Exception>> values) {");
                writer.WriteLine($"{typeof(Exception)} seed = default;");
                switch (kind)
                {
                    case 0: writer.WriteLine($"return (global::Box<{typeof(Exception)}>)value;"); break;
                    case 1: writer.WriteLine($"var query = from global::Box<{typeof(Exception)}> item in values select item; return query;"); break;
                    case 2: writer.WriteLine($"var query = from item in values join global::Box<{typeof(Exception)}> other in values on 0 equals 0 select item; return query;"); break;
                    case 3: writer.WriteLine($"global::Outer<{typeof(Exception)}>.Inner nested = default; return nested;"); break;
                    case 4: writer.WriteLine($"return value is global::Box<{typeof(Exception)}>;"); break;
                    default: writer.WriteLine($"return ((global::Box<{typeof(Exception)}> First, int Second))value;"); break;
                }
                writer.WriteRawLine("} } }");
            });
            var output = await ReduceRole(code);
            StringAssert.DoesNotContain("global::System.Exception seed", output);
            StringAssert.Contains("<global::System.Exception>", output, "The enclosing role veto must precede warm decision-cache reuse");
        }

        [Test]
        public async Task CompilerRolesCoverScopedReferencesAndFixedDeclarations()
        {
            var point = new CSharpType("Point", "Sample", true, false, null, Array.Empty<CSharpType>(), true, true);
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public struct Point { public int X; } public unsafe class Clock {");
                writer.WriteLine($"public void M(scoped ref {typeof(DateTimeOffset)} value) {{ scoped ref {typeof(DateTimeOffset)} alias = ref value; }}");
                writer.WriteRawLine("public void Pin(Point[] values) {");
                writer.WriteLine($"fixed ({point}* pointer = values) {{ }}");
                writer.WriteRawLine("} } }");
            });
            var output = await ReduceRole(code, allowUnsafe: true);
            StringAssert.Contains("scoped ref DateTimeOffset", output);
            StringAssert.Contains("fixed (Point* pointer", output);
            StringAssert.DoesNotContain("global::", output);
        }

        [Test]
        public async Task ExplicitIndexerAndEventRolesPreserveImplementedMembers()
        {
            var iface = new CSharpType("ISlot", "Sample", false, false, null, Array.Empty<CSharpType>(), true, false);
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System; namespace Sample { public interface ISlot { object this[int index] { get; } event Action Changed; } public class Clock : ISlot {");
                writer.WriteLine($"object {iface}.this[int index] => null;");
                writer.WriteLine($"event Action {iface}.Changed {{ add {{ }} remove {{ }} }}");
                writer.WriteRawLine("} }");
            });
            var output = await ReduceRole(code);
            StringAssert.Contains("ISlot.this[int index]", output);
            StringAssert.Contains("ISlot.Changed", output);
            StringAssert.DoesNotContain("global::", output);
        }

        private static async Task<string> ReduceRole(CodeFile code, bool allowUnsafe = false)
        {
            GeneratedCodeWorkspace.Initialize();
            var workspace = await GeneratedCodeWorkspace.Create(isCustomCodeProject: false);
            await workspace.AddGeneratedFile(code);
            string? output = null;
            await foreach (var file in workspace.GetGeneratedFilesAsync())
            {
                if (file.Name == code.Name)
                {
                    output = file.Text;
                }
            }

            Assert.NotNull(output);
            AssertRoleBindings(code.Content, output!, allowUnsafe);
            return output!;
        }

        private static void AssertRoleBindings(string before, string after, bool allowUnsafe)
        {
            string[] Snapshot(string source)
            {
                var tree = CSharpSyntaxTree.ParseText(source);
                var compilation = CSharpCompilation.Create("NamespaceRoleOracle", new[] { tree }, References,
                    new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary, allowUnsafe: allowUnsafe));
                Assert.That(compilation.GetDiagnostics().Where(static diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty);
                var model = compilation.GetSemanticModel(tree);
                var result = new List<string>();
                foreach (var node in tree.GetRoot().DescendantNodes())
                {
                    var type = node switch
                    {
                        OperatorDeclarationSyntax declaration => declaration.ReturnType,
                        ConversionOperatorDeclarationSyntax declaration => declaration.Type,
                        RefTypeSyntax reference => reference.Type,
                        TupleElementSyntax element => element.Type,
                        FunctionPointerParameterSyntax parameter => parameter.Type,
                        ForEachStatementSyntax statement => statement.Type,
                        DeclarationPatternSyntax pattern => pattern.Type,
                        RecursivePatternSyntax pattern => pattern.Type,
                        TypePatternSyntax pattern => pattern.Type,
                        PrimaryConstructorBaseTypeSyntax @base => @base.Type,
                        ExplicitInterfaceSpecifierSyntax specifier => specifier.Name,
                        SizeOfExpressionSyntax size => size.Type,
                        StackAllocArrayCreationExpressionSyntax stack => stack.Type,
                        ParenthesizedLambdaExpressionSyntax lambda => lambda.ReturnType,
                        BinaryExpressionSyntax binary when binary.IsKind(SyntaxKind.AsExpression) => binary.Right as TypeSyntax,
                        _ => null
                    };
                    if (type != null)
                    {
                        var symbol = model.GetTypeInfo(type).Type ?? model.GetSymbolInfo(type).Symbol as ITypeSymbol;
                        result.Add(node.Kind() + ":" + StructuralTypeNameRuleOracleTests.TypeIdentity(symbol));
                    }
                    if (node is VariableDeclaratorSyntax variable && model.GetDeclaredSymbol(variable) is ILocalSymbol local)
                    {
                        result.Add("local:" + StructuralTypeNameRuleOracleTests.TypeIdentity(local.Type));
                    }

                    if (node is TypeDeclarationSyntax && model.GetDeclaredSymbol(node) is INamedTypeSymbol declared)
                    {
                        result.Add("base:" + StructuralTypeNameRuleOracleTests.TypeIdentity(declared.BaseType));
                    }

                    if (node is BinaryExpressionSyntax isExpression && isExpression.IsKind(SyntaxKind.IsExpression))
                    {
                        result.Add("is-type:" + StructuralTypeNameRuleOracleTests.TypeIdentity(model.GetTypeInfo(isExpression.Right).Type) + ":" + model.GetSymbolInfo(isExpression.Right).Symbol?.Kind);
                    }

                    if (node is IsPatternExpressionSyntax expression && model.GetOperation(expression.Pattern) is IPatternOperation patternOperation)
                    {
                        result.Add("pattern:" + patternOperation.Kind + ":" + StructuralTypeNameRuleOracleTests.TypeIdentity(patternOperation.NarrowedType) + ":" +
                            (patternOperation is IConstantPatternOperation constant ? constant.Value.ConstantValue.ToString() : "<type>"));
                    }

                    if (node is PropertyDeclarationSyntax or IndexerDeclarationSyntax && model.GetDeclaredSymbol(node) is IPropertySymbol property)
                    {
                        result.Add("property-interface:" + string.Join("|", property.ExplicitInterfaceImplementations.Select(static implementation => implementation.OriginalDefinition.GetDocumentationCommentId() + ":" + StructuralTypeNameRuleOracleTests.TypeIdentity(implementation.ContainingType))));
                    }

                    if (node is EventDeclarationSyntax && model.GetDeclaredSymbol(node) is IEventSymbol @event)
                    {
                        result.Add("event-interface:" + string.Join("|", @event.ExplicitInterfaceImplementations.Select(static implementation => implementation.OriginalDefinition.GetDocumentationCommentId() + ":" + StructuralTypeNameRuleOracleTests.TypeIdentity(implementation.ContainingType))));
                    }

                    if (node is BaseMethodDeclarationSyntax && model.GetDeclaredSymbol(node) is IMethodSymbol method)
                    {
                        result.Add("method:" + method.RefKind + ":" + StructuralTypeNameRuleOracleTests.TypeIdentity(method.ReturnType) + ":" +
                            string.Join("|", method.ExplicitInterfaceImplementations.Select(static implementation => implementation.OriginalDefinition.GetDocumentationCommentId() + ":" + StructuralTypeNameRuleOracleTests.TypeIdentity(implementation.ContainingType))));
                    }
                }
                return result.ToArray();
            }
            Assert.That(Snapshot(after), Is.EqualTo(Snapshot(before)), "Namespace-only rewriting must preserve types and implemented interface members");
        }
    }
}
