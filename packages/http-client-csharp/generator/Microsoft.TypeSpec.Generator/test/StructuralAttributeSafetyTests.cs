// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
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
        private const string FlagDefinition = "using System; using Fixtures; namespace Fixtures { [AttributeUsage(AttributeTargets.All, AllowMultiple=true)] public class FlagAttribute:Attribute { public FlagAttribute() {} public FlagAttribute(int value, string tag=\"default\") {} public string Text {get;set;} public int Number; } } ";

        [TestCase("[global::Fixtures.FlagAttribute] public class Clock {}")]
        [TestCase("public class Clock { [global::Fixtures.FlagAttribute] public void M() {} }")]
        [TestCase("public class Clock { [return: global::Fixtures.FlagAttribute] public int M() => 1; }")]
        [TestCase("public class Clock { public void M([global::Fixtures.FlagAttribute] int value) {} }")]
        [TestCase("public class Clock { [global::Fixtures.FlagAttribute] public int Value; }")]
        [TestCase("public class Clock { [global::Fixtures.FlagAttribute] public int Value {get;set;} }")]
        [TestCase("public class Clock { public Func<int> M() => [global::Fixtures.FlagAttribute] () => 1; }")]
        public async Task StructuralAttributeSupportedDeclarationTargetsKeepMetadata(string declaration)
        {
            var source = FlagDefinition + declaration;
            var output = await Reduce(RecordedAttributeSource(source));
            StringAssert.DoesNotContain("global::Fixtures.FlagAttribute", output);
            AssertStructuralAttributes(source, output);
        }

        [TestCase("7, Text=\"named\", Number=2")]
        [TestCase("tag: \"explicit\", value: 7, Text=\"named\", Number=2")]
        public async Task StructuralAttributeArgumentMappingAndAssignmentsRemainExact(string arguments)
        {
            var source = FlagDefinition + "[global::Fixtures.FlagAttribute(" + arguments + ")] public class Clock {}";
            var output = await Reduce(RecordedAttributeSource(source));
            StringAssert.Contains("[Flag(" + arguments + ")]", output);
            AssertStructuralAttributes(source, output);
        }

        [TestCase("@FlagAttribute", "@FlagAttribute")]
        [TestCase("\\u0046lagAttribute", "\\u0046lag")]
        [TestCase("FlagAttrib\\u0075te", "FlagAttrib\\u0075te")]
        public async Task StructuralAttributeSuffixPreservesEscapeSemantics(string token, string expected)
        {
            var source = FlagDefinition + "[global::Fixtures." + token + "] public class Clock {}";
            var output = await Reduce(RecordedAttributeSource(source));
            StringAssert.Contains("[" + expected + "]", output);
            AssertStructuralAttributes(source, output);
        }

        [TestCase("asAttribute")]
        [TestCase("awaitAttribute")]
        [TestCase("fieldAttribute")]
        public async Task StructuralAttributeKeywordAndContextualSuffixesRemain(string name)
        {
            var source = "using System; using Fixtures; namespace Fixtures { public class " + name + ":Attribute {} } [global::Fixtures." + name + "] public class Clock {}";
            var target = new CSharpType(name, "Fixtures", false, false, null, Array.Empty<CSharpType>(), true, false);
            var output = await Reduce(RecordedAttributeSource(source, target));
            StringAssert.Contains("[" + name + "]", output);
            AssertStructuralAttributes(source, output);
        }

        [Test]
        public async Task StructuralAttributeTypeParameterShadowRequiresQualifiedName()
        {
            var source = FlagDefinition + "public class Clock<FlagAttribute> { [global::Fixtures.FlagAttribute] public void M() {} }";
            var output = await Reduce(RecordedAttributeSource(source));
            StringAssert.Contains("[Fixtures.Flag]", output);
            AssertStructuralAttributes(source, output);
        }

        [Test]
        public async Task StructuralAttributeDuplicateCrossRoleMetadataIsNotAuthorization()
        {
            var source = FlagDefinition + "[global::Fixtures.FlagAttribute] public class Clock {}";
            var original = RecordedAttributeSource(source);
            var ambiguous = original.TypeReferences!.Concat(original.TypeReferences!.Select(s => s with { Role = TypeReferenceRole.WholeTypeCref })).ToArray();
            var output = await Reduce(new CodeFile(source, "Clock.cs", ambiguous));
            StringAssert.Contains("[global::Fixtures.FlagAttribute]", output);
            AssertStructuralAttributes(source, output);
        }

        [TestCase("new int[] {1,2}")]
        [TestCase("null")]
        public async Task StructuralAttributeArrayAndEnumContractsKeepValues(string values)
        {
            var source = "using System; using Fixtures; namespace Fixtures { public class FlagAttribute:Attribute { public FlagAttribute(AttributeTargets targets, int[] values) {} public string[] Names {get;set;} } } " +
                "[global::Fixtures.FlagAttribute(AttributeTargets.Class | AttributeTargets.Property, " + values + ", Names=new string[]{\"a\",\"b\"})] public class Clock {}";
            var output = await Reduce(RecordedAttributeSource(source));
            StringAssert.Contains("[Flag(AttributeTargets.Class | AttributeTargets.Property", output);
            AssertStructuralAttributes(source, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StructuralAttributeCapturedLambdaNameUsesOuterObserver(bool explicitOverride)
        {
            var source = FlagDefinition + "class Clock { static string Capture(Func<int> value, [System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")] string text=null) => text; " +
                "public string M() => Capture([global::Fixtures.FlagAttribute] () => 1" + (explicitOverride ? ", \"manual\"" : "") + "); }";
            var output = await Reduce(RecordedAttributeSource(source));
            Assert.That(output.Contains("[global::Fixtures.FlagAttribute]"), Is.EqualTo(!explicitOverride));
            AssertStructuralAttributes(source, output);
            AssertParenthesesOperations(source, output);
        }

        [Test]
        public async Task StructuralAttributeConstructorCallerDefaultsAreNotNormalized()
        {
            const string source = "using System; using System.Runtime.CompilerServices; using Fixtures; namespace Fixtures { public class FlagAttribute:Attribute { public FlagAttribute([CallerMemberName]string member=null, [CallerFilePath]string path=null, [CallerLineNumber]int line=0) {} } }\n[global::Fixtures.FlagAttribute] public class Clock {}";
            var output = await Reduce(RecordedAttributeSource(source));
            // A speculative-coordinate mismatch may conservatively retain. Either
            // result must preserve actual emitted caller-derived attribute values.
            AssertStructuralAttributes(source, output);
        }

        [Test]
        public async Task StructuralAttributeConstructorCaptureKeepsArgumentText()
        {
            const string source = "using System; using System.Runtime.CompilerServices; using Fixtures; namespace Fixtures { public class FlagAttribute:Attribute { public FlagAttribute(Type type, [CallerArgumentExpression(\"type\")] string text=null) {} } } [global::Fixtures.FlagAttribute(typeof(global::System.DateTimeOffset))] public class Clock {}";
            var output = await Reduce(RecordedAttributeSource(source));
            StringAssert.Contains("typeof(global::System.DateTimeOffset)", output);
            AssertStructuralAttributes(source, output);
        }

        [TestCase("\n")]
        [TestCase("\r\n")]
        public async Task StructuralAttributeMultilineNameKeepsTriviaAndLaterLines(string newline)
        {
            var source = FlagDefinition + "[global::Fixtures." + newline + "FlagAttribute] public class Clock {}";
            var output = await Reduce(RecordedAttributeSource(source));
            StringAssert.Contains("global::Fixtures." + newline + "FlagAttribute", output);
            AssertStructuralAttributes(source, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StructuralAttributeVisibilityIsOccurrenceOwned(bool hiddenFirst)
        {
            const string hidden = "\n#line hidden\n[global::Fixtures.FlagAttribute] public class Hidden {}\n#line default\n";
            const string visible = "[global::Fixtures.FlagAttribute] public class Visible {}\n";
            var source = FlagDefinition + (hiddenFirst ? hidden + visible : visible + hidden);
            var output = await Reduce(RecordedAttributeSource(source));
            StringAssert.Contains("[global::Fixtures.FlagAttribute] public class Hidden", output);
            if (hiddenFirst)
            {
                StringAssert.Contains("[Flag] public class Visible", output);
            }

            AssertStructuralAttributes(source, output);
        }

        [TestCase("disabled")]
        [TestCase("custom")]
        [TestCase("header")]
        public async Task StructuralAttributeWorkspaceAndHeaderGatesRemain(string mode)
        {
            if (mode == "disabled")
            {
                MockHelpers.LoadMockGenerator(outputPath: _directory,
                configuration: "{\"package-name\":\"Sample\",\"disable-xml-docs\":true,\"disable-roslyn-reduce\":true}");
            }

            if (mode == "custom")
            {
                CodeModelGenerator.Instance.AddRewriter(new Probe());
            }

            var source = FlagDefinition + "[global::Fixtures.FlagAttribute] public class Clock {}";
            var extra = mode == "header" ? "#if NET8_0_OR_GREATER\nclass Variant<T> {}\n#else\nclass Variant {}\n#endif" : null;
            var output = await Reduce(RecordedAttributeSource(source), extra);
            StringAssert.Contains("[global::Fixtures.FlagAttribute]", output);
            // The custom route includes the pre-existing formatter; compare the
            // attribute contract while its unrelated formatting is tested elsewhere.
            AssertStructuralAttributes(source, output, formatterRoute: mode == "custom");
        }

        [Test]
        public void StructuralAttributeOracleRejectsChangedConstructorValuesAndNamedMembers()
        {
            var source = FlagDefinition + "[global::Fixtures.FlagAttribute(7, Text=\"value\", Number=2)] public class Clock {}";
            AssertStructuralAttributes(source, source.Replace("global::Fixtures.FlagAttribute", "Flag"));
            Assert.Throws<AssertionException>(() => AssertStructuralAttributes(source, source.Replace("(7,", "(8,")));
            Assert.Throws<AssertionException>(() => AssertStructuralAttributes(source, source.Replace("Text=\"value\"", "Text=\"different\"")));
            Assert.Throws<AssertionException>(() => AssertStructuralAttributes(source, source.Replace("Number=2", "Number=3")));
        }

        [Test]
        public void StructuralAttributeOperationProofRejectsChangedImplicitDefaults()
        {
            const string source = "using System; using System.Runtime.CompilerServices; class FlagAttribute:Attribute { public FlagAttribute([CallerLineNumber]int line=0){} }\n[Flag] class First {}\n\n[Flag] class Second {}";
            var tree = CSharpSyntaxTree.ParseText(source);
            var compilation = CSharpCompilation.Create("AttrDefaultProof", new[] { tree }, References, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            var model = compilation.GetSemanticModel(tree);
            var attributes = tree.GetRoot().DescendantNodes().OfType<AttributeSyntax>().Where(a => a.Name.ToString() == "Flag").ToArray();
            var first = (IAttributeOperation)model.GetOperation(attributes[0])!;
            var second = (IAttributeOperation)model.GetOperation(attributes[1])!;
            var a = (IObjectCreationOperation)first.Operation;
            var b = (IObjectCreationOperation)second.Operation;
            Assert.That(SymbolEqualityComparer.IncludeNullability.Equals(a.Constructor, b.Constructor), Is.True);
            Assert.That(a.Arguments.Single().ArgumentKind, Is.EqualTo(b.Arguments.Single().ArgumentKind));
            Assert.That(a.Arguments.Single().Value.ConstantValue.Value, Is.Not.EqualTo(b.Arguments.Single().Value.ConstantValue.Value));
            Assert.That(StructuralAttributeRules.SameContract(first, first), Is.True);
            Assert.That(StructuralAttributeRules.SameContract(second, second), Is.True);
            Assert.That(StructuralAttributeRules.SameContract(first, second), Is.False, "Same constructor/default mapping but different caller-derived constants must fail");
        }

        private static CodeFile RecordedAttributeSource(string source, CSharpType? type = null)
        {
            type ??= new CSharpType("FlagAttribute", "Fixtures", false, false, null, Array.Empty<CSharpType>(), true, false);
            var root = CSharpSyntaxTree.ParseText(source).GetRoot();
            var sites = root.DescendantNodes().OfType<AttributeSyntax>().Where(a => a.Name.ToString().StartsWith("global::Fixtures.", StringComparison.Ordinal))
                .Select(a => new TypeReferenceSite(a.Name.Span, type)).ToArray();
            return new CodeFile(source, "Clock.cs", sites);
        }
    }
}
