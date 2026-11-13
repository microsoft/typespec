// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    [NonParallelizable]
    public class ProviderQualifierReductionTests
    {
        private string? _previous;
        private static readonly MetadataReference[] References = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!)
            .Split(Path.PathSeparator).Select(static path => MetadataReference.CreateFromFile(path)).ToArray();

        [SetUp]
        public void SetUp()
        {
            _previous = Environment.GetEnvironmentVariable("TYPESPEC_PROVIDER_REDUCER");
            Environment.SetEnvironmentVariable("TYPESPEC_PROVIDER_REDUCER", "true");
            MockHelpers.LoadMockGenerator(configuration: "{\"package-name\":\"Example\",\"disable-xml-docs\":true}");
        }

        [TearDown]
        public void TearDown() => Environment.SetEnvironmentVariable("TYPESPEC_PROVIDER_REDUCER", _previous);

        [Test]
        public void StaticTypePrefixIsShortenedWithoutDroppingItsMember()
        {
            var output = Reduce(WriteStatic(typeof(DateTimeOffset)));
            StringAssert.Contains("DateTimeOffset.Now", output);
            StringAssert.DoesNotContain("global::System.DateTimeOffset", output);
        }

        [TestCase("DateTimeOffset")]
        [TestCase("unused")]
        public void StaticPrefixRespectsParameterShadowing(string parameter)
        {
            var output = Reduce(WriteStatic(typeof(DateTimeOffset), $"object {parameter}"));
            if (parameter == "DateTimeOffset")
            {
                StringAssert.Contains("global::System.DateTimeOffset.Now", output);
            }
            else
            {
                StringAssert.DoesNotContain("global::System.DateTimeOffset", output);
            }
        }

        [TestCase("from DateTimeOffset in new[] { 1 } select ")]
        [TestCase("from first in new[] { 1 } let DateTimeOffset = first select ")]
        [TestCase("from first in new[] { 1 } join DateTimeOffset in new[] { 1 } on first equals DateTimeOffset select ")]
        [TestCase("from first in new[] { 1 } group first by first into DateTimeOffset select ")]
        [TestCase("from first in new[] { 1 } join second in new[] { 1 } on first equals second into DateTimeOffset select ")]
        public void QueryRangeVariablesKeepStaticReceiverQualified(string query)
        {
            using var writer = new CodeWriter();
            writer.WriteRawLine("using System.Linq;");
            writer.WriteRawLine("namespace Example { public class Consumer {");
            writer.WriteRawLine("public object M() => " + query);
            writer.WriteLine($"{typeof(DateTimeOffset)}.Now;");
            writer.WriteRawLine("} }");
            StringAssert.Contains("global::System.DateTimeOffset.Now", Reduce(File(writer)));
        }

        [Test]
        public void ImplicitAccessorValueKeepsStaticReceiverQualified()
        {
            var type = new CSharpType("value", "Example", false, false, null, Array.Empty<CSharpType>(), true, false);
            using var writer = new CodeWriter();
            writer.WriteRawLine("namespace Example { public class Consumer { public int P { set {");
            writer.WriteLine($"_ = {type}.Now;");
            writer.WriteRawLine("} } } }");
            StringAssert.Contains("global::Example.value.Now", Reduce(File(writer),
                "namespace Example { public class value { public static int Now => 1; } }"));
        }

        [Test]
        public void NameofStaticMemberKeepsItsTargetAndConstant()
        {
            using var writer = new CodeWriter();
            writer.WriteRawLine("namespace Example { public class Consumer {");
            writer.WriteLine($"public string M() => nameof({typeof(DateTimeOffset)}.Now);");
            writer.WriteRawLine("} }");
            StringAssert.Contains("nameof(DateTimeOffset.Now)", Reduce(File(writer)));
        }

        [TestCase(false)]
        [TestCase(true)]
        public void ContextualAttributeSuffixIsRetainedAcrossOrdinaryAndAsyncContexts(bool qualifiedOnly)
        {
            var type = new CSharpType("awaitAttribute", "Example", false, false, null, Array.Empty<CSharpType>(), true, false);
            using var writer = new CodeWriter();
            writer.WriteRawLine(qualifiedOnly ? "namespace Other {" : "namespace Example {");
            writer.WriteLine($"[{type}]");
            writer.WriteRawLine("public class Consumer { public async System.Threading.Tasks.Task M() {");
            writer.WriteLine($"[{type}]");
            writer.WriteRawLine("void Local() {} Local(); await System.Threading.Tasks.Task.CompletedTask; } } }");
            var additional = "namespace Example { public sealed class awaitAttribute : System.Attribute {} }" +
                (qualifiedOnly ? "namespace Other { public class awaitAttribute : System.Attribute {} }" : string.Empty);
            var output = Reduce(File(writer), additional);
            StringAssert.Contains(qualifiedOnly ? "[global::Example.awaitAttribute]" : "[awaitAttribute]", output);
            StringAssert.DoesNotContain("[await]", output);
            StringAssert.DoesNotContain("[global::Example.await]", output);
        }

        [Test]
        public void TypeAndShadowedExpressionDecisionsDoNotShareCacheEntries()
        {
            using var writer = new CodeWriter();
            writer.WriteRawLine("using System.Linq;");
            writer.WriteRawLine("namespace Example { public class Consumer {");
            writer.WriteLine($"public {typeof(DateTimeOffset)} Value => default;");
            writer.WriteLine($"public object M() => from DateTimeOffset in new[] {{1}} select {typeof(DateTimeOffset)}.Now;");
            writer.WriteRawLine("} }");
            var output = Reduce(File(writer));
            StringAssert.Contains("public DateTimeOffset Value", output);
            StringAssert.Contains("global::System.DateTimeOffset.Now", output);
        }

        [Test]
        public void StaticMethodAndGenericReceiverKeepSelectedMembers()
        {
            using var writer = new CodeWriter();
            writer.WriteRawLine("namespace Example { public class Consumer {");
            writer.WriteLine($"public string M() => {typeof(Convert)}.ToString(42);");
            writer.WriteLine($"public int Compare() => {typeof(Comparer<DateTimeOffset>)}.Default.Compare(default, default);");
            writer.WriteRawLine("} }");
            var output = Reduce(File(writer));
            StringAssert.Contains("Convert.ToString(42)", output);
            StringAssert.Contains("Comparer<DateTimeOffset>.Default", output);
        }

        [Test]
        public void AttributeQualificationAndSuffixAreShortened()
        {
            var output = Reduce(WriteAttribute(typeof(ObsoleteAttribute)));
            StringAssert.Contains("[Obsolete(\"message\")]", output);
        }

        [Test]
        public void AttributeShortNameCollisionRetainsSuffix()
        {
            var output = Reduce(WriteAttribute(typeof(ObsoleteAttribute)), "namespace Example { public class Obsolete : System.Attribute {} }");
            StringAssert.Contains("[ObsoleteAttribute(\"message\")]", output);
        }

        [Test]
        public void AttributeAliasCollisionRetainsSuffix()
        {
            var output = Reduce(WriteAttribute(typeof(ObsoleteAttribute), "using Obsolete = Example.OtherAttribute;"),
                "namespace Example { public class OtherAttribute : System.Attribute {} }");
            StringAssert.Contains("[ObsoleteAttribute(\"message\")]", output);
        }

        [Test]
        public void AttributeExpandedFullNameCollisionCanUseUnambiguousShortName()
        {
            var output = Reduce(WriteAttribute(typeof(ObsoleteAttribute), "using Other;"),
                "namespace Other { public class ObsoleteAttributeAttribute : System.Attribute { public ObsoleteAttributeAttribute(string text) {} } }");
            StringAssert.Contains("[Obsolete(\"message\")]", output);
        }

        [Test]
        public void AttributeQualificationCollisionAllowsQualifiedSuffixOnly()
        {
            var output = Reduce(WriteAttribute(typeof(ObsoleteAttribute)),
                "namespace Example { public class ObsoleteAttribute : System.Attribute {} }");
            StringAssert.Contains("[global::System.Obsolete(\"message\")]", output);
        }

        [Test]
        public void CompetingShortNameInTargetNamespaceRetainsAttributeSuffix()
        {
            var type = new CSharpType("NoticeAttribute", "Example", false, false, null, Array.Empty<CSharpType>(), true, false);
            var output = Reduce(WriteAttribute(type),
                "namespace Example { public class Notice {} public class NoticeAttribute : System.Attribute { public NoticeAttribute(string text) {} } }");
            StringAssert.Contains("[NoticeAttribute(\"message\")]", output);
        }

        [TestCase(typeof(Attribute))] // Abstract attribute target.
        [TestCase(typeof(System.Text.StringBuilder))] // Not an attribute target.
        [TestCase(typeof(List<int>))] // Generic, not an attribute target.
        public void UnsupportedRecordedAttributeTargetsAreNotReduced(Type type)
        {
            // These are deliberately invalid C# attribute targets; this oracle
            // checks retention, not compilation acceptance of the original input.
            var file = WriteAttribute(type);
            var tree = CSharpSyntaxTree.ParseText(file.Content);
            var compilation = CSharpCompilation.Create("InvalidAttribute", new[] { tree }, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.True(new ProviderNameReducer(compilation).TryPlan(tree.GetRoot(), file.TypeReferences!, out var plan));
            Assert.AreEqual(file.Content, plan!.Apply().ToString());
        }

        [Test]
        public void AttributeFullNameCollisionRetainsQualification()
        {
            var output = Reduce(WriteAttribute(typeof(ObsoleteAttribute)),
                "namespace Example { public class ObsoleteAttribute : System.Attribute {} }");
            StringAssert.Contains("[global::System.", output);
        }

        [Test]
        public void AttributeArgumentsAlsoShortenRecordedStaticReceivers()
        {
            using var writer = new CodeWriter();
            writer.WriteRawLine("namespace Example {");
            writer.WriteLine($"[{typeof(AttributeUsageAttribute)}({typeof(AttributeTargets)}.All)]");
            writer.WriteRawLine("public class Consumer : System.Attribute {} }");
            StringAssert.Contains("[AttributeUsage(AttributeTargets.All)]", Reduce(File(writer)));
        }

        [Test]
        public void CombinedGenericAndStaticEditsPreserveBindings()
        {
            using var writer = new CodeWriter();
            writer.WriteRawLine("namespace Example { public class Consumer {");
            writer.WriteLine($"public {typeof(List<DateTimeOffset>)} Values => default;");
            writer.WriteLine($"public object M() => {typeof(DateTimeOffset)}.Now;");
            writer.WriteRawLine("} }");
            var output = Reduce(File(writer));
            StringAssert.Contains("List<DateTimeOffset>", output);
            StringAssert.Contains("DateTimeOffset.Now", output);
        }

        private static CodeFile WriteStatic(CSharpType type, string parameters = "")
        {
            using var writer = new CodeWriter();
            writer.WriteRawLine("namespace Example { public class Consumer {");
            writer.WriteLine($"public object M({parameters}) => {type}.Now;");
            writer.WriteRawLine("} }");
            return File(writer);
        }

        private static CodeFile WriteAttribute(CSharpType type, string import = "")
        {
            using var writer = new CodeWriter();
            if (import.Length > 0)
            {
                writer.WriteRawLine(import);
            }

            writer.WriteRawLine("namespace Example {");
            writer.WriteLine($"[{type}(\"message\")]");
            writer.WriteRawLine("public class Consumer {} }");
            return File(writer);
        }

        private static CodeFile File(CodeWriter writer) => new(writer.ToString(), "Consumer.cs", writer.TypeReferences);

        private static string Reduce(CodeFile file, string? additional = null)
        {
            var tree = CSharpSyntaxTree.ParseText(file.Content);
            var trees = additional == null ? new[] { tree } : new[] { tree, CSharpSyntaxTree.ParseText(additional) };
            var compilation = CSharpCompilation.Create("QualifierBindings", trees, References, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            AssertNoErrors(compilation);
            var root = tree.GetRoot();
            Assert.True(ProviderNameReducer.TryMatchReferences(root, file.TypeReferences!, out var references));
            Assert.True(new ProviderNameReducer(compilation).TryPlan(root, file.TypeReferences!, out var plan));
            var model = compilation.GetSemanticModel(tree);
            var observations = new List<(TextSpan Span, string Identity, bool Constant)>();
            foreach (var reference in references)
            {
                observations.Add((reference.Span, Identity(model, reference), false));
                if (reference.Parent is AttributeSyntax attribute)
                {
                    observations.Add((attribute.Span, Identity(model, attribute), false));
                }

                if (reference.Parent is MemberAccessExpressionSyntax member && member.Expression == reference)
                {
                    observations.Add((member.Span, Identity(model, member), false));
                }

                foreach (var invocation in reference.Ancestors().OfType<InvocationExpressionSyntax>().Where(static n => n.Expression.ToString() == "nameof"))
                {
                    observations.Add((invocation.Span, model.GetConstantValue(invocation).Value!.ToString()!, true));
                }
            }
            var output = plan!.Apply().ToString();
            var parsed = CSharpSyntaxTree.ParseText(output);
            var after = compilation.ReplaceSyntaxTree(tree, parsed);
            AssertNoErrors(after);
            var afterModel = after.GetSemanticModel(parsed);
            foreach (var observation in observations)
            {
                var start = observation.Span.Start - plan.Deletions.Where(cut => cut.End <= observation.Span.Start).Sum(static cut => cut.Length);
                var end = observation.Span.End - plan.Deletions.Where(cut => cut.End <= observation.Span.End).Sum(static cut => cut.Length);
                var span = TextSpan.FromBounds(start, end);
                var node = parsed.GetRoot().FindNode(span, getInnermostNodeForTie: true);
                Assert.AreEqual(span, node.Span, "Every original type/member/attribute must retain an exact emitted node");
                Assert.AreEqual(observation.Identity, observation.Constant ? afterModel.GetConstantValue(node).Value!.ToString()! : Identity(afterModel, node), node.ToString());
            }
            return output;
        }

        private static string Identity(SemanticModel model, SyntaxNode node)
        {
            var symbol = model.GetSymbolInfo(node).Symbol ?? model.GetTypeInfo(node).Type;
            Assert.NotNull(symbol, node.ToString());
            return symbol!.ContainingAssembly?.Identity + ":" + symbol.ToDisplayString(SymbolDisplayFormat.CSharpErrorMessageFormat);
        }

        private static void AssertNoErrors(Compilation compilation) => Assert.That(
            compilation.GetDiagnostics().Where(static d => d.Severity == DiagnosticSeverity.Error).Select(static d => d.ToString()), Is.Empty);
    }
}
