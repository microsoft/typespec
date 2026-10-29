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
        [TestCase(false, false)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(true, true)]
        public async Task StructuralThisReceiverBoundDataMemberReadsAndWritesKeepIdentity(bool property, bool write)
        {
            var declaration = property ? "private int Value { get; set; }" : "private int Value;";
            var method = write ? "public void M(int value) { this.Value = value; }" : "public int M() => this.Value;";
            var source = "class Clock { " + declaration + method + " }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains(write ? "{ Value = value; }" : "=> Value;", output);
            StringAssert.DoesNotContain("this.Value", output);
            AssertThisMemberBindings(source, output);
        }

        [Test]
        public async Task StructuralThisReceiverInheritedAndConstructedMembersKeepIdentity()
        {
            const string source = "class Base<T> { protected T Value; } class Clock<T> : Base<T> { public T M() => this.Value; }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("=> Value;", output);
            AssertThisMemberBindings(source, output);
        }

        [TestCase("parameter")]
        [TestCase("lambda")]
        [TestCase("query")]
        [TestCase("local")]
        public async Task StructuralThisReceiverActualSiteValuesRetainQualification(string kind)
        {
            var method = kind switch
            {
                "parameter" => "public int M(int Value) => this.Value;",
                "lambda" => "public System.Func<int, int> M() => Value => this.Value;",
                "query" => "public object M() => from Value in new[] { 1 } select this.Value;",
                _ => "public int M() { int Value = 1; return this.Value; }"
            };
            var source = "using System.Linq; class Clock { private int Value; " + method + " }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("this.Value", output);
            AssertThisMemberBindings(source, output);
        }

        [Test]
        public async Task StructuralThisReceiverPositionProofDoesNotLeakAcrossBlocks()
        {
            const string source = "class Clock { private int Value; public int M() { int first = this.Value; { int Value = 0; int blocked = this.Value; } int last = this.Value; return last; } }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("first = Value", output);
            StringAssert.Contains("blocked = this.Value", output);
            StringAssert.Contains("last = Value", output);
            AssertThisMemberBindings(source, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StructuralThisReceiverPreservesCaptureAndExplicitOverrides(bool explicitText)
        {
            var source = "class Clock { private int Value; public object M() => Capture(this.Value" + (explicitText ? ", \"manual\"" : "") + "); private object Capture(object value, [System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")] string text = \"\") => text; }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains(explicitText ? "Capture(Value, \"manual\")" : "Capture(this.Value)", output);
            AssertThisMemberBindings(source, output);
        }

        [Test]
        public async Task StructuralThisReceiverRetainsMethodEventNameofDynamicAndInitializerBoundaries()
        {
            const string source = "class Clock { private int Value; private dynamic Data; private int Other() => 1; public event System.Action Changed; public void E() { this.Changed += () => {}; } public int M() => this.Other(); public object D() => this.Data; public string N() => nameof(this.Value); public object I() => new Clock { Value = this.Value }; }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            foreach (var retained in new[] { "this.Other()", "this.Changed", "this.Data", "nameof(this.Value)", "Value = this.Value" }) StringAssert.Contains(retained, output);
            AssertThisMemberBindings(source, output);
        }

        [Test]
        public async Task StructuralThisReceiverConditionalDocumentRemainsConservative()
        {
            const string source = "class Clock { private int Value; public int M() => this.Value; public int C() {\n#if NET8_0_OR_GREATER\nreturn 8;\n#else\nreturn 0;\n#endif\n} }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("=> this.Value", output);
            AssertThisMemberBindings(source, output);
        }

        [Test]
        public async Task StructuralThisReceiverDoesNotRemoveInternalCommentsOrPhysicalLines()
        {
            const string source = "class Clock { private int Value; public int M() => this./* keep */Value; public int N() => this.\nValue; }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("this./* keep */Value", output);
            StringAssert.Contains("this.\nValue", output);
            AssertBoundaryTriviaIdentity(source, output);
            AssertThisMemberBindings(source, output);
        }

        [Test]
        public void StructuralThisReceiverSpeculationRequiresDetachedReplacement()
        {
            const string source = "class Clock { private int Value; public int M(int Value) => this.Value; }";
            var tree = CSharpSyntaxTree.ParseText(source);
            var compilation = CSharpCompilation.Create("ThisSpeculationProbe", new[] { tree }, References, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            var model = compilation.GetSemanticModel(tree);
            var member = tree.GetRoot().DescendantNodes().OfType<MemberAccessExpressionSyntax>().Single();
            var name = (IdentifierNameSyntax)member.Name;
            var attached = model.GetSpeculativeSymbolInfo(member.SpanStart, name, SpeculativeBindingOption.BindAsExpression);
            var replacement = SyntaxFactory.IdentifierName(name.Identifier).WithTriviaFrom(member);
            var detached = model.GetSpeculativeSymbolInfo(member.SpanStart, replacement, SpeculativeBindingOption.BindAsExpression);
            Assert.That(attached.Symbol, Is.InstanceOf<IFieldSymbol>(), "Attached member.Name is promoted to its original access");
            Assert.That(replacement.Parent, Is.Null);
            Assert.That(detached.Symbol, Is.InstanceOf<IParameterSymbol>(), "Actual standalone replacement must observe lexical shadowing");
            Assert.That(SymbolEqualityComparer.IncludeNullability.Equals(attached.Symbol, detached.Symbol), Is.False);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void StructuralThisReceiverSharedStaticMaterializerReturnsDetachedExpression(bool generic)
        {
            var source = "using System; using System.Collections.Generic; class Clock { object M() => " +
                (generic ? "global::System.Collections.Generic.Comparer<int>.Default" : "global::System.DateTimeOffset.Now") + "; }";
            var tree = CSharpSyntaxTree.ParseText(source);
            var compilation = CSharpCompilation.Create("DetachedStaticMaterialization", new[] { tree }, References, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            var model = compilation.GetSemanticModel(tree);
            var member = tree.GetRoot().DescendantNodes().OfType<MemberAccessExpressionSyntax>().First();
            var receiver = member.Expression;
            var target = (INamedTypeSymbol)model.GetSymbolInfo(receiver).Symbol!;
            var description = StructuralTypeNameSelector.Describe(receiver);
            var selected = StructuralTypeNameSelector.Choose(new[] { new StructuralTypeNameSelector.Context(compilation, model, receiver, target,
                Source: description, PreserveTerminalArguments: true, ModeOverride: StructuralTypeNameSelector.Mode.Expression) });
            var expression = selected.Plan!.RenderExpression(description)!;
            Assert.That(expression.Parent, Is.Null);
            Assert.That(SymbolEqualityComparer.IncludeNullability.Equals(target,
                model.GetSpeculativeSymbolInfo(receiver.SpanStart, expression, SpeculativeBindingOption.BindAsExpression).Symbol), Is.True);
        }

        private static void AssertThisMemberBindings(string before, string after, string? additional = null)
        {
            string[] Snapshot(string source)
            {
                var tree = CSharpSyntaxTree.ParseText(source);
                var trees = additional == null ? new[] { tree } : new[] { tree, CSharpSyntaxTree.ParseText(additional) };
                var compilation = CSharpCompilation.Create("ThisMemberOracle", trees, References,
                    new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
                Assert.That(compilation.GetDiagnostics().Where(static diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty);
                var model = compilation.GetSemanticModel(tree);
                var values = new List<string>();
                foreach (var expression in tree.GetRoot().DescendantNodes().OfType<ExpressionSyntax>())
                {
                    var operation = model.GetOperation(expression);
                    if (operation == null || operation.Syntax.Span != expression.Span) continue;
                    var member = operation switch
                    {
                        IFieldReferenceOperation field => (ISymbol)field.Field,
                        IPropertyReferenceOperation property => property.Property,
                        _ => null
                    };
                    if (member == null || member.IsStatic) continue;
                    var instance = ((IMemberReferenceOperation)operation).Instance;
                    var instanceIdentity = instance is IInstanceReferenceOperation receiver ? receiver.ReferenceKind.ToString() : instance?.Kind.ToString();
                    values.Add(member.OriginalDefinition.GetDocumentationCommentId() + ":" + StructuralTypeNameRuleOracleTests.TypeIdentity(member.ContainingType) + ":" +
                        instanceIdentity + ":" + StructuralTypeNameRuleOracleTests.TypeIdentity(instance?.Type));
                }
                return values.ToArray();
            }
            Assert.That(Snapshot(after), Is.EqualTo(Snapshot(before)), "Exact data members and semantic containing-instance identities must survive");
            AssertParenthesesOperations(before + "\n" + additional, after + "\n" + additional, normalizeThisReceiver: true);
        }
    }
}
