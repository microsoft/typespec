// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    [NonParallelizable]
    public partial class StructuralTypeNameIntegrationTests
    {
        private static readonly MetadataReference[] References = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!)
            .Split(Path.PathSeparator).Select(static path => MetadataReference.CreateFromFile(path)).ToArray();
        private string? _previous;
        private string _directory = null!;

        [SetUp]
        public void SetUp()
        {
            _previous = Environment.GetEnvironmentVariable("TYPESPEC_PROVIDER_REDUCER");
            Environment.SetEnvironmentVariable("TYPESPEC_PROVIDER_REDUCER", "structural");
            _directory = Path.Combine(Path.GetTempPath(), "typespec-structural", Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(_directory);
            MockHelpers.LoadMockGenerator(outputPath: _directory,
                configuration: "{\"package-name\":\"Sample\",\"disable-xml-docs\":true}");
            GeneratedCodeWorkspace.PostProcessingProfile = new GeneratedCodeWorkspacePostProcessingProfile();
        }

        [TearDown]
        public void TearDown()
        {
            GeneratedCodeWorkspace.PostProcessingProfile = null;
            Environment.SetEnvironmentVariable("TYPESPEC_PROVIDER_REDUCER", _previous);
            Directory.Delete(_directory, recursive: true);
        }

        [Test]
        public void StructuralModeRecordsExistingTypedReferenceMetadata()
        {
            using var writer = new CodeWriter();
            writer.WriteRawLine("namespace Sample { public class Clock {");
            writer.WriteLine($"public {typeof(DateTimeOffset)} Timestamp => default;");
            writer.WriteRawLine("} }");
            writer.ToString();
            Assert.That(writer.TypeReferences, Is.Not.Null.And.Not.Empty);
        }

        [Test]
        public async Task TypeOnlyNamesReduceDuringExistingMemberRemovalButOtherFamiliesStayUntouched()
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
            StringAssert.DoesNotContain("namespace Empty", output);
            StringAssert.Contains("public DateTimeOffset Timestamp", output);
            StringAssert.Contains("TimeSpan Echo(TimeSpan value)", output);
            StringAssert.Contains("Snapshot() => DateTimeOffset.Now", output);
            StringAssert.Contains("nameof(global::System.DateTimeOffset)", output);
            StringAssert.Contains("typeof(DateTimeOffset)", output);
            StringAssert.Contains("[Obsolete]", output);
            var profile = GeneratedCodeWorkspace.PostProcessingProfile!.GetSummary();
            StringAssert.Contains("StructuralTypeNames", profile);
            StringAssert.DoesNotContain("Roslyn.Simplifier.ReduceAsync", profile);
            StringAssert.DoesNotContain("ProviderReducer.Reduce", profile);
            Assert.AreEqual(1, Count(profile, "MemberRemoverRewriter"));
            Assert.AreEqual(1, Count(profile, "StructuralTypeNames.Visit"));
            Assert.AreEqual(3, Count(profile, "StructuralTypeNames.Region"));
            Assert.AreEqual(3, Count(profile, "StructuralTypeNames.Decision"));
            Assert.AreEqual(1, Count(profile, "StructuralTypeNames.CacheHit"));
        }

        [Test]
        public async Task MethodTypeParameterDoesNotPolluteSiblingDeclarationScope()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock {");
                writer.WriteLine($"public {typeof(DateTimeOffset)} Timestamp => default;");
                writer.WriteLine($"public {typeof(DateTimeOffset)} Echo<DateTimeOffset>({typeof(DateTimeOffset)} value) => value;");
                writer.WriteRawLine("} }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("public DateTimeOffset Timestamp", output);
            // A safe namespace-qualified form is preferable to unnecessarily
            // retaining global::. The rule oracle already pins this selection.
            StringAssert.Contains("System.DateTimeOffset Echo<DateTimeOffset>(System.DateTimeOffset value)", output);
            StringAssert.Contains("StructuralTypeNames.Visit", GeneratedCodeWorkspace.PostProcessingProfile!.GetSummary());
        }

        [Test]
        public async Task MissingMetadataKeepsNamesWithoutFallingBackToRoslyn()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock {");
                writer.WriteLine($"public {typeof(DateTimeOffset)} Timestamp => default;");
                writer.WriteRawLine("} }");
            });
            var output = await Reduce(new CodeFile(code.Content, code.Name));
            StringAssert.Contains("global::System.DateTimeOffset", output);
            StringAssert.DoesNotContain("Roslyn.Simplifier.ReduceAsync", GeneratedCodeWorkspace.PostProcessingProfile!.GetSummary());
        }

        [Test]
        public async Task DecisionCacheCannotRewriteAReferenceWhoseRecordedIdentityIsWrong()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock {");
                writer.WriteLine($"public {typeof(DateTimeOffset)} First => default;");
                writer.WriteLine($"public {typeof(TimeSpan)} Second => default;");
                writer.WriteRawLine("} }");
            });
            var references = code.TypeReferences!.Select(static site => site.Type.Name == "TimeSpan" ? site with { Type = (CSharpType)typeof(DateTimeOffset) } : site).ToArray();
            var output = await Reduce(new CodeFile(code.Content, code.Name, references));
            StringAssert.Contains("DateTimeOffset First", output);
            StringAssert.Contains("global::System.TimeSpan Second", output);
        }

        [Test]
        public async Task InvalidSpanCannotRewriteAnUnprovenName()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock {");
                writer.WriteLine($"public {typeof(DateTimeOffset)} Timestamp => default;");
                writer.WriteRawLine("} }");
            });
            var invalid = code.TypeReferences!.Select(static site => site with { Span = new Microsoft.CodeAnalysis.Text.TextSpan(site.Span.Start + 1, site.Span.Length) }).ToArray();
            var output = await Reduce(new CodeFile(code.Content, code.Name, invalid));
            StringAssert.Contains("global::System.DateTimeOffset", output);
        }

        [Test]
        public async Task CustomRewriterRetainsItsSemanticContractWithoutStructuralOrRoslynReduction()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock {");
                writer.WriteLine($"public {typeof(DateTimeOffset)} Timestamp => default;");
                writer.WriteRawLine("} }");
            });
            var probe = new Probe();
            CodeModelGenerator.Instance.AddRewriter(probe);
            var output = await Reduce(code);
            Assert.True(probe.SawModel);
            StringAssert.Contains("global::System.DateTimeOffset", output);
            StringAssert.DoesNotContain("Roslyn.Simplifier.ReduceAsync", GeneratedCodeWorkspace.PostProcessingProfile!.GetSummary());
        }

        [Test]
        public async Task LocalFunctionNestedTypeAndDelegateOwnIndependentTypeParameterScopes()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock {");
                writer.WriteLine($"public {typeof(DateTimeOffset)} M() {{");
                writer.WriteLine($"{typeof(DateTimeOffset)} first = default;");
                writer.WriteLine($"{typeof(DateTimeOffset)} Local<DateTimeOffset>({typeof(DateTimeOffset)} value) => value;");
                writer.WriteLine($"{typeof(DateTimeOffset)} last = default;");
                writer.WriteRawLine("return first; }");
                writer.WriteLine($"public delegate {typeof(DateTimeOffset)} Factory<DateTimeOffset>({typeof(DateTimeOffset)} value);");
                writer.WriteRawLine("public class Inner<DateTimeOffset> {");
                writer.WriteLine($"public {typeof(DateTimeOffset)} Timestamp => default;");
                writer.WriteRawLine("} } }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("DateTimeOffset first", output);
            StringAssert.Contains("DateTimeOffset last", output);
            StringAssert.Contains("System.DateTimeOffset Local<DateTimeOffset>(System.DateTimeOffset value)", output);
            StringAssert.Contains("System.DateTimeOffset Factory<DateTimeOffset>(System.DateTimeOffset value)", output);
            StringAssert.Contains("System.DateTimeOffset Timestamp", output);
        }

        [Test]
        public async Task SameSimpleMetadataNameInDifferentNamespacesHasDistinctDecisions()
        {
            var a = new CSharpType("Widget", "A", false, false, null, Array.Empty<CSharpType>(), true, false);
            var b = new CSharpType("Widget", "B", false, false, null, Array.Empty<CSharpType>(), true, false);
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace A { public class Widget {} } namespace B { public class Widget {} }");
                writer.WriteRawLine("namespace Sample { public class Clock {");
                writer.WriteLine($"public {a} First => default;");
                writer.WriteLine($"public {b} Second => default;");
                writer.WriteRawLine("} }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("A.Widget First", output);
            StringAssert.Contains("B.Widget Second", output);
        }

        [Test]
        public async Task ConcurrentDocumentsHaveIndependentTraversalAndSemanticState()
        {
            var a = Recorded(writer =>
            {
                writer.WriteRawLine("namespace A { public class Clock<DateTimeOffset> {");
                writer.WriteLine($"public {typeof(DateTimeOffset)} Timestamp => default;");
                writer.WriteRawLine("} }");
            });
            var b = Recorded(writer =>
            {
                writer.WriteRawLine("namespace B { public class Clock {");
                writer.WriteLine($"public {typeof(DateTimeOffset)} Timestamp => default;");
                writer.WriteRawLine("} }");
            });
            GeneratedCodeWorkspace.Initialize();
            var workspace = await GeneratedCodeWorkspace.Create(isCustomCodeProject: false);
            await workspace.AddGeneratedFile(a);
            await workspace.AddGeneratedFile(new CodeFile(b.Content, "Other.cs", b.TypeReferences));
            var output = new Dictionary<string, string>();
            await foreach (var file in workspace.GetGeneratedFilesAsync())
            {
                output.Add(file.Name, file.Text);
            }

            StringAssert.Contains("System.DateTimeOffset Timestamp", output["Clock.cs"]);
            StringAssert.Contains("public DateTimeOffset Timestamp", output["Other.cs"]);
            AssertBindings(a.Content, output["Clock.cs"]);
            AssertBindings(b.Content, output["Other.cs"]);
        }

        [Test]
        public async Task GenericContainingOwnerIsOutsideTheFirstSlice()
        {
            const string source = "namespace Sample { public class Outer<T> { public class Inner {} } public class Clock { public global::Sample.Outer<int>.Inner Value => default; } }";
            var outer = new CSharpType("Outer", "Sample", false, false, null, new CSharpType[] { typeof(int) }, true, false);
            var inner = new CSharpType("Inner", "Sample", false, false, outer, Array.Empty<CSharpType>(), true, false);
            var node = CSharpSyntaxTree.ParseText(source).GetRoot().DescendantNodes().OfType<PropertyDeclarationSyntax>().Single().Type;
            var code = new CodeFile(source, "Clock.cs", new[] { new TypeReferenceSite(node.Span, inner) });
            StringAssert.Contains("global::Sample.Outer<int>.Inner Value", await Reduce(code));
        }

        [Test]
        public async Task ExternalConditionalHeaderKeepsOrdinaryDocumentQualified()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public partial class Clock {");
                writer.WriteLine($"public {typeof(DateTimeOffset)} Timestamp => default;");
                writer.WriteRawLine("} }");
            });
            var extra = "namespace Sample { public partial class Clock {\n#if NET6_0_OR_GREATER\npublic class DateTimeOffset {}\n#endif\n} }";
            StringAssert.Contains("global::System.DateTimeOffset Timestamp", await Reduce(code, extra));
        }

        [Test]
        public async Task DisabledReductionKeepsNamesAndDoesNotStartStructuralSelection()
        {
            MockHelpers.LoadMockGenerator(outputPath: _directory,
                configuration: "{\"package-name\":\"Sample\",\"disable-xml-docs\":true,\"disable-roslyn-reduce\":true}");
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock {");
                writer.WriteLine($"public {typeof(DateTimeOffset)} Timestamp => default;");
                writer.WriteRawLine("} }");
            });
            StringAssert.Contains("global::System.DateTimeOffset Timestamp", await Reduce(code));
            StringAssert.DoesNotContain("StructuralTypeNames.Visit", GeneratedCodeWorkspace.PostProcessingProfile!.GetSummary());
        }

        [TestCase(false)]
        [TestCase(true)]
        public void ActualOutputOracleDetectsChangedLocalOrDelegateReturnType(bool delegateType)
        {
            var source = delegateType
                ? "namespace Sample { public delegate global::System.DateTimeOffset Factory(); }"
                : "namespace Sample { public class Clock { public void M() { global::System.DateTimeOffset value = default; } } }";
            var changed = source.Replace("DateTimeOffset", "TimeSpan", StringComparison.Ordinal);
            Assert.Throws<AssertionException>(() => AssertBindings(source, changed),
                "The output oracle must not silently omit these declaration types");
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task DeclarationGenericArgumentSupportAndContainingSegmentLimitAreExplicit(bool containingSegment)
        {
            var source = containingSegment
                ? "using System; namespace Sample { public class Outer<T> { public class Inner {} } public class Clock { public global::Sample.Outer<global::System.DateTimeOffset>.Inner Value => default; } }"
                : "using System; using System.Collections.Generic; namespace Sample { public class Clock { public List<global::System.DateTimeOffset> Value => default; } }";
            var site = CSharpSyntaxTree.ParseText(source).GetRoot().DescendantNodes().OfType<QualifiedNameSyntax>()
                .Single(static node => node.ToString() == "global::System.DateTimeOffset");
            var output = await Reduce(new CodeFile(source, "Clock.cs", new[] { new TypeReferenceSite(site.Span, typeof(DateTimeOffset)) }));
            if (containingSegment)
            {
                StringAssert.Contains("Outer<global::System.DateTimeOffset>.Inner", output);
            }
            else
            {
                StringAssert.Contains("List<DateTimeOffset>", output);
            }
        }

        [Test]
        public async Task GenericDeclarationArgumentsIgnoreBlockLocalValueShadowing()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System.Collections.Generic; namespace Sample { public class Clock { public void M() {");
                writer.WriteLine($"List<{typeof(DateTimeOffset)}> first = default;");
                writer.WriteRawLine("{ int DateTimeOffset = 0;");
                writer.WriteLine($"List<{typeof(DateTimeOffset)}> second = default;");
                writer.WriteRawLine("}");
                writer.WriteLine($"List<{typeof(DateTimeOffset)}> last = default;");
                writer.WriteRawLine("} } }");
            });
            var output = await Reduce(code);
            StringAssert.DoesNotContain("global::System.DateTimeOffset", output);
            StringAssert.Contains("List<DateTimeOffset> second", output);
            Assert.AreEqual(2, Count(GeneratedCodeWorkspace.PostProcessingProfile!.GetSummary(), "StructuralTypeNames.CacheHit"));
        }

        [Test]
        public async Task ExistingAliasAndNongenericNestedOwnerUseTheProductionSelector()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using DTO = System.DateTimeOffset; namespace Sample { public class DateTimeOffset {} public class Clock {");
                writer.WriteLine($"public {typeof(DateTimeOffset)} Timestamp => default;");
                writer.WriteLine($"public {typeof(Environment.SpecialFolder)} Folder => default;");
                writer.WriteRawLine("} }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("DTO Timestamp", output);
            StringAssert.Contains("Environment.SpecialFolder Folder", output);
        }

        [TestCase(0)] // Embedded comment.
        [TestCase(1)] // Wrong provenance role.
        [TestCase(2)] // Duplicate exact span.
        [TestCase(3)] // Nonglobal original root.
        public async Task LaterUnprovenOccurrenceCannotReuseACleanCachedDecision(int kind)
        {
            var second = kind == 0 ? "global::System./*keep*/DateTimeOffset" : kind == 3 ? "System.DateTimeOffset" : "global::System.DateTimeOffset";
            var source = "using System; namespace Sample { public class Clock { public global::System.DateTimeOffset First => default; public " + second + " Second => default; } }";
            var properties = CSharpSyntaxTree.ParseText(source).GetRoot().DescendantNodes().OfType<PropertyDeclarationSyntax>().ToArray();
            var sites = new List<TypeReferenceSite>
            {
                new(properties[0].Type.Span, typeof(DateTimeOffset)),
                new(properties[1].Type.Span, typeof(DateTimeOffset), kind == 1 ? TypeReferenceRole.WholeTypeCref : TypeReferenceRole.Code)
            };
            if (kind == 2)
            {
                sites.Add(sites[1]);
            }

            var output = await Reduce(new CodeFile(source, "Clock.cs", sites));
            StringAssert.Contains("DateTimeOffset First", output);
            StringAssert.Contains(second + " Second", output);
        }

        [Test]
        public async Task RecordedReferencesInExcludedContextsRemainUnchangedAfterADeclarationDecision()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public sealed class HolderAttribute : global::System.Attribute { public HolderAttribute(global::System.Type type) {} }");
                writer.WriteLine($"[Holder(typeof({typeof(Exception)}))]");
                writer.WriteLine($"public class Clock : {typeof(Exception)} {{");
                writer.WriteLine($"public {typeof(Exception)} Value => default;");
                writer.WriteLine($"public object Cast(object value) => ({typeof(Exception)})value;");
                writer.WriteLine($"public object Create() => new {typeof(Exception)}();");
                writer.WriteLine($"public global::System.Type Kind() => typeof({typeof(Exception)});");
                writer.WriteLine($"public string Name() => nameof({typeof(Exception)});");
                writer.WriteLine($"public bool Same() => {typeof(Exception)}.ReferenceEquals(null, null);");
                writer.WriteLine($"public void Call() => Use<{typeof(Exception)}>();");
                writer.WriteRawLine("private void Use<T>() {} }");
                writer.WriteRawLine("}");
            });
            var output = await Reduce(code);
            StringAssert.Contains("Exception Value", output);
            foreach (var supported in new[] { "Clock : Exception", "new Exception()", "typeof(Exception)", "Use<Exception>()" })
            {
                StringAssert.Contains(supported, output);
            }

            AssertOperationBindings(code.Content, output);
            StringAssert.Contains("Same() => Exception.ReferenceEquals(null, null)", output);
            foreach (var preserved in new[] { "Holder(typeof(global::System.Exception))", "(global::System.Exception)value", "nameof(global::System.Exception)" })
            {
                StringAssert.Contains(preserved, output);
            }
        }

        private static int Count(string profile, string name) => int.Parse(profile.Split('\n').Single(line => line.StartsWith(name + ", ", StringComparison.Ordinal)).Split(',')[1]);

        private static CodeFile Recorded(Action<CodeWriter> emit)
        {
            // Allows the before-implementation run to test workspace behavior
            // independently of the separate structural-mode metadata-capture gap.
            Environment.SetEnvironmentVariable("TYPESPEC_PROVIDER_REDUCER", "true");
            try
            {
                using var writer = new CodeWriter();
                emit(writer);
                return new CodeFile(writer.ToString(), "Clock.cs", writer.TypeReferences);
            }
            finally { Environment.SetEnvironmentVariable("TYPESPEC_PROVIDER_REDUCER", "structural"); }
        }

        private static async Task<string> Reduce(CodeFile code, string? extra = null)
        {
            GeneratedCodeWorkspace.Initialize();
            var workspace = await GeneratedCodeWorkspace.Create(isCustomCodeProject: false);
            await workspace.AddGeneratedFile(code);
            if (extra != null)
            {
                await workspace.AddGeneratedFile(new CodeFile(extra, "Additional.cs"));
            }

            string? result = null;
            await foreach (var file in workspace.GetGeneratedFilesAsync())
            {
                if (file.Name == code.Name)
                {
                    result = file.Text;
                }
            }

            Assert.NotNull(result);
            AssertBindings(code.Content, result!, extra);
            return result!;
        }

        private static void AssertBindings(string before, string after, string? additional = null)
        {
            string[] Snapshot(string source)
            {
                var tree = CSharpSyntaxTree.ParseText(source);
                var trees = additional == null ? new[] { tree } : new[] { tree, CSharpSyntaxTree.ParseText(additional) };
                var compilation = CSharpCompilation.Create("StructuralIntegrationOracle", trees, References,
                    new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
                Assert.That(compilation.GetDiagnostics().Where(static d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
                var model = compilation.GetSemanticModel(tree);
                // Name substitutions and empty-namespace pruning preserve typed
                // declaration order. Its ordinal is a stable structural key even
                // for locals/local functions whose documentation IDs collide.
                var result = new List<string>();
                foreach (var node in tree.GetRoot().DescendantNodes().Where(static node => node is VariableDeclaratorSyntax or PropertyDeclarationSyntax or
                    MethodDeclarationSyntax or LocalFunctionStatementSyntax or ParameterSyntax or DelegateDeclarationSyntax))
                {
                    var symbol = model.GetDeclaredSymbol(node);
                    var type = symbol switch
                    {
                        IFieldSymbol field => field.Type,
                        ILocalSymbol local => local.Type,
                        IPropertySymbol property => property.Type,
                        INamedTypeSymbol { TypeKind: TypeKind.Delegate } @delegate => @delegate.DelegateInvokeMethod!.ReturnType,
                        IMethodSymbol method => method.ReturnType,
                        IParameterSymbol parameter => parameter.Type,
                        _ => null
                    };
                    if (type == null)
                    {
                        continue;
                    }

                    result.Add(result.Count + ":" + symbol!.Kind + ":" + symbol.Name + ":" + StructuralTypeNameRuleOracleTests.TypeIdentity(type));
                }
                return result.ToArray();
            }
            Assert.That(Snapshot(after), Is.EqualTo(Snapshot(before)), "Declaration type identities must survive actual workspace output");
        }

        private sealed class Probe : LibraryRewriter
        {
            internal bool SawModel { get; private set; }
            public override SyntaxNode? VisitCompilationUnit(CompilationUnitSyntax node)
            {
                SawModel = SemanticModel != null;
                return base.VisitCompilationUnit(node);
            }
        }
    }
}
