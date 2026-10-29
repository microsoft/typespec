// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Operations;
using Microsoft.CodeAnalysis.Text;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        [Test]
        public async Task StructuralAttributeRecordedNameAndSuffixKeepConstructor()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System;");
                writer.WriteLine($"[{typeof(ObsoleteAttribute)}(\"message\")]");
                writer.WriteRawLine("public class Clock {}");
            });
            var output = await Reduce(code);
            StringAssert.Contains("[Obsolete(\"message\")]", output);
            AssertStructuralAttributes(code.Content, output);
        }

        [TestCase("FlagAttribute", "Flag")]
        [TestCase("Tag", "Tag")]
        public async Task StructuralAttributeNamedAssignmentsKeepMembersAndValues(string name, string expected)
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System; using Fixtures; namespace Fixtures { public class " + name + ":Attribute { public " + name + "(int value) {} public string Text {get;set;} public int Number; } }");
                writer.WriteLine($"[{new CSharpType(name, "Fixtures", false, false, null, Array.Empty<CSharpType>(), true, false)}(7, Text=\"value\", Number=3)]");
                writer.WriteRawLine("public class Clock {}");
            });
            var output = await Reduce(code);
            StringAssert.Contains("[" + expected + "(7, Text=\"value\", Number=3)]", output);
            AssertStructuralAttributes(code.Content, output);
        }

        [Test]
        public async Task StructuralAttributeArgumentTypeQualificationIsNotPartOfNameReduction()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System; using Fixtures; namespace Fixtures { public class FlagAttribute:Attribute { public FlagAttribute(Type type) {} } }");
                writer.WriteLine($"[{new CSharpType("FlagAttribute", "Fixtures", false, false, null, Array.Empty<CSharpType>(), true, false)}(typeof({typeof(DateTimeOffset)}))]");
                writer.WriteRawLine("public class Clock {}");
            });
            var output = await Reduce(code);
            StringAssert.Contains("[Flag(typeof(global::System.DateTimeOffset))]", output);
            AssertStructuralAttributes(code.Content, output);
        }

        [Test]
        public async Task StructuralAttributeAmbiguousSuffixKeepsUnabbreviatedName()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System; using Fixtures; using Other; namespace Fixtures { public class FlagAttribute:Attribute {} } namespace Other { public class Flag:Attribute {} }");
                writer.WriteLine($"[{new CSharpType("FlagAttribute", "Fixtures", false, false, null, Array.Empty<CSharpType>(), true, false)}]");
                writer.WriteRawLine("public class Clock {}");
            });
            var output = await Reduce(code);
            StringAssert.Contains("[FlagAttribute]", output);
            AssertStructuralAttributes(code.Content, output);
        }

        [TestCase("missing")]
        [TestCase("wrongSpan")]
        [TestCase("wrongType")]
        [TestCase("wrongRole")]
        public async Task StructuralAttributeInvalidProvenanceRetains(string mode)
        {
            var original = Recorded(writer =>
            {
                writer.WriteRawLine("using System;");
                writer.WriteLine($"[{typeof(ObsoleteAttribute)}(\"message\")]");
                writer.WriteRawLine("public class Clock {}");
            });
            var sites = original.TypeReferences!.Select(site => mode switch
            {
                "wrongSpan" => site with { Span = new TextSpan(site.Span.Start + 1, site.Span.Length - 1) },
                "wrongType" => site with { Type = typeof(CLSCompliantAttribute) },
                "wrongRole" => site with { Role = TypeReferenceRole.WholeTypeCref },
                _ => site
            }).ToArray();
            var code = new CodeFile(original.Content, original.Name, mode == "missing" ? Array.Empty<TypeReferenceSite>() : sites);
            var output = await Reduce(code);
            StringAssert.Contains("[global::System.ObsoleteAttribute(\"message\")]", output);
            AssertStructuralAttributes(code.Content, output);
        }

        [Test]
        public async Task StructuralAttributeConditionalDocumentRemainsConservative()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System;");
                writer.WriteLine($"[{typeof(ObsoleteAttribute)}(\"message\")]");
                writer.WriteRawLine("public class Clock { private int V() {\n#if NET8_0_OR_GREATER\nreturn 8;\n#else\nreturn 6;\n#endif\n} }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("[global::System.ObsoleteAttribute(\"message\")]", output);
            AssertStructuralAttributes(code.Content, output);
        }

        [Test]
        public void StructuralAttributeProbeWholeSpeculativeModel()
        {
            const string source = "using System; [global::System.ObsoleteAttribute(\"message\")] public class Clock {}";
            var tree = CSharpSyntaxTree.ParseText(source);
            var compilation = CSharpCompilation.Create("AttributeApiProbe", new[] { tree }, References, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            var model = compilation.GetSemanticModel(tree);
            var original = tree.GetRoot().DescendantNodes().OfType<AttributeSyntax>().Single();
            var candidate = SyntaxFactory.Attribute(SyntaxFactory.IdentifierName("Obsolete"), original.ArgumentList);
            Assert.That(model.TryGetSpeculativeSemanticModel(original.SpanStart, candidate, out var speculative), Is.True);
            Assert.That(speculative, Is.Not.Null);
            var spec = speculative!;
            var oldCtor = model.GetSymbolInfo(original); var newCtor = spec.GetSymbolInfo(candidate);
            Assert.That(SymbolEqualityComparer.IncludeNullability.Equals(oldCtor.Symbol, newCtor.Symbol), Is.True);
            Assert.That(model.GetOperation(original), Is.InstanceOf<IAttributeOperation>());
            Assert.That(spec.GetOperation(candidate), Is.InstanceOf<IAttributeOperation>());
        }

        [Test]
        public async Task StructuralAttributeFormerTypeOnlyPolicyNowAdmitsRecordedAttribute()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Empty { }");
                writer.WriteRawLine("namespace Sample {");
                writer.WriteLine($"[{typeof(ObsoleteAttribute)}]");
                writer.WriteRawLine("public class Clock {");
                writer.WriteLine($"public {typeof(DateTimeOffset)} Timestamp => default;");
                writer.WriteLine($"public {typeof(TimeSpan)} Echo({typeof(TimeSpan)} value) => value;");
                writer.WriteLine($"public object Snapshot() => {typeof(DateTimeOffset)}.Now;");
                writer.WriteLine($"public string Name() => nameof({typeof(DateTimeOffset)});");
                writer.WriteLine($"public System.Type Kind() => typeof({typeof(DateTimeOffset)});");
                writer.WriteRawLine("} }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("[Obsolete]", output);
            StringAssert.Contains("nameof(global::System.DateTimeOffset)", output);
        }

        private static void AssertStructuralAttributes(string before, string after, bool formatterRoute = false)
        {
            string Type(ITypeSymbol? type) => StructuralTypeNameRuleOracleTests.TypeIdentity(type);
            string Constant(TypedConstant value) => value.Kind + ":" + Type(value.Type) + ":" +
                (value.IsNull ? "<null>" : value.Kind == TypedConstantKind.Array ? "[" + string.Join(",", value.Values.Select(Constant)) + "]" :
                    value.Value is ITypeSymbol type ? Type(type) : Convert.ToString(value.Value, System.Globalization.CultureInfo.InvariantCulture));
            (string[] Contracts, string Outside) Snapshot(string source)
            {
                var tree = CSharpSyntaxTree.ParseText(source);
                var compilation = CSharpCompilation.Create("AttributeOracle", new[] { tree }, References,
                    new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
                Assert.That(compilation.GetDiagnostics().Where(static d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
                var model = compilation.GetSemanticModel(tree);
                var attributes = tree.GetRoot().DescendantNodes().OfType<AttributeSyntax>().ToArray();
                var contracts = attributes.Select(attribute =>
                {
                    var info = model.GetSymbolInfo(attribute);
                    Assert.That(info.Symbol, Is.InstanceOf<IMethodSymbol>());
                    Assert.That(info.CandidateReason, Is.EqualTo(CandidateReason.None));
                    Assert.That(info.CandidateSymbols, Is.Empty);
                    var list = (AttributeListSyntax)attribute.Parent!;
                    var owner = list.Parent!;
                    var symbols = owner switch
                    {
                        CompilationUnitSyntax => new[] { list.Target?.Identifier.ValueText == "module" ? (ISymbol)compilation.SourceModule : compilation.Assembly },
                        BaseFieldDeclarationSyntax field => field.Declaration.Variables.Select(v => model.GetDeclaredSymbol(v)!).ToArray(),
                        LambdaExpressionSyntax lambda => new[] { ((IAnonymousFunctionOperation)model.GetOperation(lambda)!).Symbol },
                        _ => new[] { model.GetDeclaredSymbol(owner)! }
                    };
                    var records = symbols.Select(symbol =>
                    {
                        var values = list.Target?.Identifier.ValueText == "return" && symbol is IMethodSymbol method ? method.GetReturnTypeAttributes() : symbol.GetAttributes();
                        return values.Single(a => a.ApplicationSyntaxReference?.Span == attribute.Span);
                    }).ToArray();
                    var data = records[0];
                    var members = attribute.ArgumentList?.Arguments.Where(a => a.NameEquals != null)
                        .Select(a => model.GetSymbolInfo(a.NameEquals!.Name).Symbol?.GetDocumentationCommentId()) ?? Array.Empty<string?>();
                    return info.Symbol!.GetDocumentationCommentId() + ":" + Type(data.AttributeClass) + ":" +
                        string.Join("||", records.Select(record => string.Join("|", record.ConstructorArguments.Select(Constant)) + ":named=" +
                            string.Join("|", record.NamedArguments.Select(a => a.Key + "=" + Constant(a.Value))))) +
                        ":members=" + string.Join("|", members);
                }).ToArray();
                var outside = tree.GetText().WithChanges(attributes.Select(attribute => new TextChange(attribute.Name.Span, "__ATTRIBUTE_NAME__"))).ToString();
                return (contracts, outside);
            }
            var original = Snapshot(before); var candidate = Snapshot(after);
            Assert.That(candidate.Contracts, Is.EqualTo(original.Contracts), "Whole attribute constructors/typed constants/named members must remain identical");
            if (formatterRoute)
                Assert.That(SyntaxFactory.AreEquivalent(CSharpSyntaxTree.ParseText(candidate.Outside).GetRoot(), CSharpSyntaxTree.ParseText(original.Outside).GetRoot()), Is.True);
            else
            {
                Assert.That(candidate.Outside, Is.EqualTo(original.Outside), "All source including argument expressions outside attribute NAME spans must stay exact");
                Assert.That(System.Text.RegularExpressions.Regex.Matches(after, "\\r\\n|\\r|\\n").Select(m => m.Value),
                    Is.EqualTo(System.Text.RegularExpressions.Regex.Matches(before, "\\r\\n|\\r|\\n").Select(m => m.Value)));
            }
        }
    }
}
