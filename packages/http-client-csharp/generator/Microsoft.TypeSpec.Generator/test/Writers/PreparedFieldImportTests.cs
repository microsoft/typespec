// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    public class PreparedFieldImportTests
    {
        [SetUp]
        public async Task SetUp() => await MockHelpers.LoadMockGeneratorAsync(
            compilation: () => Task.FromResult<Compilation>(Compilation()));

        [TestCase("framework")]
        [TestCase("generated")]
        [TestCase("reference")]
        public void NormalImportFieldIsPreparedBeforeWriting(string kind)
        {
            var target = new ImportedType("Widget", "Library");
            var fieldType = kind switch
            {
                "framework" => (CSharpType)typeof(DateTimeOffset),
                "generated" => target.Type,
                _ => ReferenceType("Library", "Widget")
            };
            var compilation = kind == "reference" ? Compilation(Reference()) : Compilation();
            var owner = new ImportOwner(fieldType);
            var roots = kind == "generated" ? new TypeProvider[] { owner, target } : [owner];
            var canonical = owner.Fields[0].Type;
            var baseline = new TypeProviderWriter(owner).Write();
            using var prepared = PreparedFieldTypes.Create(roots, compilation, _ => true);
            var actual = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            var declarations = kind == "generated" ? new[] { new TypeProviderWriter(target).Write().Content } : [];

            Assert.Multiple(() =>
            {
                Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);
                Assert.That(actual.Content, Does.Contain($"private {fieldType.Name} _value;"));
                Assert.That(Imports(actual.Content), Is.EqualTo(Imports(baseline.Content)), "Shortening must not invent or lose original imports.");
                Assert.That(actual.QualifiedContent, Is.EqualTo(baseline.Content));
                Assert.That(owner.Fields[0].Type, Is.SameAs(canonical));
                Assert.That(prepared.CanCommit(), Is.True);
            });
            AssertBindingAndDiagnostics(compilation, owner.Type.Namespace, baseline.Content, actual.Content, declarations);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void KnownUnreferencedImportedCompetitorRetainsQualification(bool generatedCompetitor)
        {
            var target = new ImportedType("Widget", "Library");
            var otherWidget = new ImportedType("Widget", "Competitor");
            var beacon = new ImportedType("Beacon", "Competitor");
            var owner = new ImportOwner(target.Type, propertyType: beacon.Type);
            var roots = generatedCompetitor ? new TypeProvider[] { owner, target, beacon, otherWidget } : [owner, target, beacon];
            var compilation = generatedCompetitor ? Compilation() : Compilation(Reference("namespace Competitor { public class Widget {} }"));
            var baseline = new TypeProviderWriter(owner).Write();
            using var prepared = PreparedFieldTypes.Create(roots, compilation, _ => true);
            var actual = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();

            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.False);
            Assert.That(actual.Content, Is.EqualTo(baseline.Content));
            Assert.That(actual.Content, Does.Contain("private global::Library.Widget _value;"));
            AssertBindingAndDiagnostics(compilation, owner.Type.Namespace, baseline.Content, actual.Content,
                roots.Where(p => !ReferenceEquals(p, owner)).Select(p => new TypeProviderWriter(p).Write().Content).ToArray());
        }

        [TestCase(false)]
        [TestCase(true)]
        public void GenericOnlyImportCompetitorDoesNotHideArityZeroField(bool generated)
        {
            var target = new ImportedType("Widget", "Library");
            var competitor = new ImportedType("Widget", "Competitor", generic: true);
            var beacon = new ImportedType("Beacon", "Competitor");
            var compilation = generated ? Compilation() : Compilation(Reference(
                "namespace Library { public class Widget {} } namespace Competitor { public class Widget<T> {} public class Beacon {} }"));
            var owner = new ImportOwner(generated ? target.Type : ReferenceType("Library", "Widget"),
                propertyType: generated ? beacon.Type : ReferenceType("Competitor", "Beacon"));
            var roots = generated ? new TypeProvider[] { owner, target, competitor, beacon } : [owner];
            var baseline = new TypeProviderWriter(owner).Write();
            using var prepared = PreparedFieldTypes.Create(roots, compilation, _ => true);
            var actual = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();

            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);
            Assert.That(actual.Content, Does.Contain("private Widget _value;"));
            AssertBindingAndDiagnostics(compilation, owner.Type.Namespace, baseline.Content, actual.Content,
                roots.Where(p => !ReferenceEquals(p, owner)).Select(p => new TypeProviderWriter(p).Write().Content).ToArray());
        }

        [TestCase(ReportDiagnostic.Warn)]
        [TestCase(ReportDiagnostic.Error)]
        [TestCase(ReportDiagnostic.Suppress)]
        public void NondefaultImportDiagnosticPolicyRetainsQualification(ReportDiagnostic reporting)
        {
            var compilation = Compilation(Reference());
            compilation = compilation.WithOptions(compilation.Options.WithSpecificDiagnosticOptions(
                new Dictionary<string, ReportDiagnostic> { ["CS8019"] = reporting }));
            var owner = new ImportOwner(ReferenceType("Library", "Widget"));
            var baseline = new TypeProviderWriter(owner).Write();
            using var prepared = PreparedFieldTypes.Create([owner], compilation, _ => true);
            var actual = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();

            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.False);
            Assert.That(actual.Content, Is.EqualTo(baseline.Content));
            var before = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(baseline.Content));
            var after = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(actual.Content));
            Assert.That(Diagnostics(after), Is.EqualTo(Diagnostics(before)));
        }

        [Test]
        public void UnimportedCompetitorDoesNotBlockNormalImportPositive()
        {
            var compilation = Compilation(Reference());
            var owner = new ImportOwner(ReferenceType("Library", "Widget"));
            var baseline = new TypeProviderWriter(owner).Write();
            using var prepared = PreparedFieldTypes.Create([owner], compilation, _ => true);
            var actual = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();

            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);
            Assert.That(actual.Content, Does.Contain("private Widget _value;"));
            Assert.That(Imports(actual.Content), Is.EqualTo(new[] { "Library" }));
            AssertBindingAndDiagnostics(compilation, owner.Type.Namespace, baseline.Content, actual.Content);
        }

        [TestCase(false, "Sample")]
        [TestCase(false, "Sample.Inner")]
        [TestCase(true, "Sample")]
        [TestCase(true, "Sample.Inner")]
        public void GeneratedNamespaceShadowRetainsImportFieldQualification(bool generatedTarget, string ownerNamespace)
        {
            var target = new ImportedType("Widget", "Library");
            var shadow = new ImportedType("Beacon", "Sample.Widget");
            var compilation = generatedTarget ? Compilation() : Compilation(Reference());
            var owner = new ImportOwner(generatedTarget ? target.Type : ReferenceType("Library", "Widget"), ownerNamespace);
            var roots = generatedTarget ? new TypeProvider[] { owner, target, shadow } : [owner, shadow];
            var baseline = new TypeProviderWriter(owner).Write();
            using var prepared = PreparedFieldTypes.Create(roots, compilation, _ => true);
            var actual = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            var declarations = roots.Where(p => !ReferenceEquals(p, owner))
                .Select(p => new TypeProviderWriter(p).Write().Content).ToArray();
            var after = compilation.AddSyntaxTrees(declarations.Select(code => CSharpSyntaxTree.ParseText(code))
                .Append(CSharpSyntaxTree.ParseText(actual.Content)));
            TestContext.WriteLine(string.Join("\n", after.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error)));

            Assert.Multiple(() =>
            {
                Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.False);
                Assert.That(actual.Content, Is.EqualTo(baseline.Content));
                Assert.That(after.GetDiagnostics().Any(d => d.Id == "CS0118"), Is.False);
            });
            AssertBindingAndDiagnostics(compilation, ownerNamespace, baseline.Content, actual.Content, declarations);
        }

        [TestCase(ReportDiagnostic.Warn, false)]
        [TestCase(ReportDiagnostic.Error, false)]
        [TestCase(ReportDiagnostic.Warn, true)]
        [TestCase(ReportDiagnostic.Error, true)]
        public void ProviderBackedImportDiagnosticPolicyRetainsQualification(ReportDiagnostic reporting, bool global)
        {
            var compilation = Compilation();
            compilation = compilation.WithOptions(compilation.Options.WithSyntaxTreeOptionsProvider(new ImportReporting(reporting, global)));
            var owner = new ImportOwner(typeof(DateTimeOffset));
            var baseline = new TypeProviderWriter(owner).Write();
            using var prepared = PreparedFieldTypes.Create([owner], compilation, _ => true);
            var actual = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            var before = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(baseline.Content, path: "Clock.cs"));
            var after = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(actual.Content, path: "Clock.cs"));
            var expectedSeverity = reporting == ReportDiagnostic.Error ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning;
            TestContext.WriteLine($"Provider policy {reporting}/{global}: {string.Join(", ", Diagnostics(before))}");

            Assert.Multiple(() =>
            {
                Assert.That(before.GetDiagnostics().Any(d => d.Id == "CS8019" && d.Severity == expectedSeverity), Is.True);
                Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.False);
                Assert.That(actual.Content, Is.EqualTo(baseline.Content));
                Assert.That(Diagnostics(after), Is.EqualTo(Diagnostics(before)));
            });
        }

        [Test]
        public void ProviderBackedImportPolicyDoesNotDisableSameNamespaceTaskZeroFields()
        {
            var compilation = Compilation();
            compilation = compilation.WithOptions(compilation.Options.WithSyntaxTreeOptionsProvider(new ImportReporting(ReportDiagnostic.Error, true)));
            var target = new ImportedType("Widget", "Sample");
            var owner = new ImportOwner(target.Type);
            using var prepared = PreparedFieldTypes.Create([owner, target], compilation, _ => true);
            var actual = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();

            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);
            Assert.That(actual.Content, Does.Contain("private Widget _value;"));
        }

        [TestCase("Sample")]
        [TestCase("Sample.Inner")]
        public void NearerNamespaceTypeRetainsQualification(string ownerNamespace)
        {
            var compilation = Compilation(Reference()).AddSyntaxTrees(CSharpSyntaxTree.ParseText("namespace Sample { class Widget {} }"));
            var owner = new ImportOwner(ReferenceType("Library", "Widget"), ownerNamespace);
            var baseline = new TypeProviderWriter(owner).Write();
            using var prepared = PreparedFieldTypes.Create([owner], compilation, _ => true);
            var actual = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();

            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.False);
            Assert.That(actual.Content, Is.EqualTo(baseline.Content));
            AssertBindingAndDiagnostics(compilation, ownerNamespace, baseline.Content, actual.Content);
        }

        [Test]
        public void AncestorNamespaceTargetKeepsItsCanonicalBinding()
        {
            var compilation = Compilation(Reference("namespace Library { public class Widget {} }"));
            var owner = new ImportOwner(ReferenceType("Library", "Widget"), "Library.Child");
            var baseline = new TypeProviderWriter(owner).Write();
            using var prepared = PreparedFieldTypes.Create([owner], compilation, _ => true);
            var actual = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();

            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);
            Assert.That(actual.Content, Does.Contain("private Widget _value;"));
            AssertBindingAndDiagnostics(compilation, owner.Type.Namespace, baseline.Content, actual.Content);
        }

        [TestCase("using Alias = Library.Widget;")]
        [TestCase("using static System.Math;")]
        [TestCase("global using Library;")]
        [TestCase("extern alias External;")]
        public void UnsupportedImportEnvironmentRetainsQualification(string imports)
        {
            var compilation = Compilation(Reference()).AddSyntaxTrees(CSharpSyntaxTree.ParseText(imports + "namespace Custom { class Other {} }"));
            var owner = new ImportOwner(ReferenceType("Library", "Widget"));
            var baseline = new TypeProviderWriter(owner).Write();
            using var prepared = PreparedFieldTypes.Create([owner], compilation, _ => true);
            var actual = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();

            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.False);
            Assert.That(actual.Content, Is.EqualTo(baseline.Content));
        }

        [Test]
        public void MissingMetadataRetainsQualificationAndExistingErrors()
        {
            var compilation = Compilation();
            var owner = new ImportOwner(ReferenceType("Missing", "Widget"));
            var baseline = new TypeProviderWriter(owner).Write();
            using var prepared = PreparedFieldTypes.Create([owner], compilation, _ => true);
            var actual = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            var before = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(baseline.Content));
            var after = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(actual.Content));

            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.False);
            Assert.That(actual.Content, Is.EqualTo(baseline.Content));
            Assert.That(before.GetDiagnostics().Any(d => d.Severity == DiagnosticSeverity.Error), Is.True);
            Assert.That(Diagnostics(after), Is.EqualTo(Diagnostics(before)));
        }

        [TestCase(false)]
        [TestCase(true)]
        public void LateImportIsCheckedAgainstPreparedCompetitorsWithoutCallbackReplay(bool ambiguous)
        {
            var compilation = Compilation(Reference());
            var calls = 0;
            var owner = new ImportOwner(ReferenceType("Library", "Widget"), initializer: new ImportCallback(
                ambiguous ? "Competitor" : "Harmless", () => calls++));
            var baseline = new TypeProviderWriter(owner).Write();
            calls = 0;
            using var prepared = PreparedFieldTypes.Create([owner], compilation, _ => true);
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);
            var actual = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            var canCommit = prepared.CanCommit();
            var committed = canCommit ? actual : actual.WithoutPreparedNames();

            Assert.That(calls, Is.EqualTo(1));
            Assert.That(canCommit, Is.EqualTo(!ambiguous));
            Assert.That(Imports(committed.Content), Is.EqualTo(Imports(baseline.Content)));
            Assert.That(actual.QualifiedContent, Is.EqualTo(baseline.Content));
            Assert.That(committed.Content, Does.Contain(ambiguous ? "private global::Library.Widget _value" : "private Widget _value"));
            AssertBindingAndDiagnostics(compilation, owner.Type.Namespace, baseline.Content, committed.Content);
        }

        [Test]
        public void MixedUnreducedPropertyDoesNotChangeNormalImportFieldDecision()
        {
            var compilation = Compilation(Reference());
            var owner = new ImportOwner(ReferenceType("Library", "Widget"), propertyType: ReferenceType("Harmless", "Beacon"));
            var baseline = new TypeProviderWriter(owner).Write();
            using var prepared = PreparedFieldTypes.Create([owner], compilation, _ => true);
            var actual = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();

            Assert.That(actual.Content, Does.Contain("private Widget _value;"));
            Assert.That(actual.Content, Does.Contain("global::Harmless.Beacon Other"));
            Assert.That(Imports(actual.Content), Is.EqualTo(Imports(baseline.Content)));
            AssertBindingAndDiagnostics(compilation, owner.Type.Namespace, baseline.Content, actual.Content);
        }

        private static string[] Imports(string code) => CSharpSyntaxTree.ParseText(code).GetCompilationUnitRoot().Usings
            .Select(u => u.Name!.ToString()).OrderBy(n => n, StringComparer.Ordinal).ToArray();

        private static string[] Diagnostics(Compilation compilation) => compilation.GetDiagnostics()
            .Select(d => $"{d.Id}:{d.Severity}:{d.GetMessage()}").OrderBy(d => d, StringComparer.Ordinal).ToArray();

        private static void AssertBindingAndDiagnostics(CSharpCompilation compilation, string ownerNamespace, string beforeCode,
            string afterCode, params string[] declarations)
        {
            var trees = declarations.Select(code => CSharpSyntaxTree.ParseText(code)).ToArray();
            var before = compilation.AddSyntaxTrees(trees.Append(CSharpSyntaxTree.ParseText(beforeCode)));
            var after = compilation.AddSyntaxTrees(trees.Append(CSharpSyntaxTree.ParseText(afterCode)));
            Assert.That(before.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            Assert.That(after.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            var oldField = before.GetTypeByMetadataName(ownerNamespace + ".Clock")!.GetMembers("_value").OfType<IFieldSymbol>().Single();
            var newField = after.GetTypeByMetadataName(ownerNamespace + ".Clock")!.GetMembers("_value").OfType<IFieldSymbol>().Single();
            Assert.That(newField.Type.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat),
                Is.EqualTo(oldField.Type.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat)));
            // Normal type spelling can turn an original normal using into a used
            // import. No other diagnostic delta is permitted, including errors.
            string[] Relevant(Compilation c) => c.GetDiagnostics()
                .Where(d => d.Id != "CS8019" || d.Severity != DiagnosticSeverity.Hidden || d.IsSuppressed)
                .Select(d => $"{d.Id}:{d.Severity}:{d.GetMessage()}").OrderBy(d => d, StringComparer.Ordinal).ToArray();
            Assert.That(Relevant(after), Is.EqualTo(Relevant(before)));
        }

        private static CSharpCompilation Compilation(params MetadataReference[] references) => CSharpCompilation.Create("PreparedImports",
            references: new[] { MetadataReference.CreateFromFile(typeof(object).Assembly.Location) }.Concat(references),
            options: new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

        private static PortableExecutableReference Reference(string source = "namespace Library { public class Widget {} } namespace Competitor { public class Widget {} public class Beacon {} } namespace Harmless { public class Beacon {} }")
        {
            var compilation = Compilation().WithAssemblyName("ImportReference").AddSyntaxTrees(CSharpSyntaxTree.ParseText(source));
            using var stream = new MemoryStream();
            var emit = compilation.Emit(stream);
            Assert.That(emit.Success, Is.True, string.Join("\n", emit.Diagnostics));
            return MetadataReference.CreateFromImage(stream.ToArray());
        }

        private static CSharpType ReferenceType(string ns, string name) => new(name, ns, false, false, null, [], true, false);

        private sealed class ImportedType(string name, string ns, bool generic = false) : TypeProvider
        {
            protected override string BuildName() => name;
            protected override string BuildNamespace() => ns;
            protected override string BuildRelativeFilePath() => ns.Replace('.', '_') + "_" + name + ".cs";
            protected override CSharpType[] GetTypeArguments() => generic ? [typeof(GenericMarker<>).GetGenericArguments()[0]] : [];
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class;
        }

        private sealed class ImportOwner(CSharpType fieldType, string ns = "Sample", CSharpType? propertyType = null,
            ValueExpression? initializer = null) : TypeProvider
        {
            protected override string BuildName() => "Clock";
            protected override string BuildNamespace() => ns;
            protected override string BuildRelativeFilePath() => "Clock.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class;
            protected internal override FieldProvider[] BuildFields() => [new FieldProvider(FieldModifiers.Private, fieldType, "_value", this, initializationValue: initializer)];
            protected internal override PropertyProvider[] BuildProperties() => propertyType is null ? [] :
                [new PropertyProvider(null, MethodSignatureModifiers.Private, propertyType, "Other", new AutoPropertyBody(true), this)];
        }

        private sealed class ImportReporting(ReportDiagnostic reporting, bool global) : SyntaxTreeOptionsProvider
        {
            public override GeneratedKind IsGenerated(SyntaxTree tree, CancellationToken cancellationToken) => GeneratedKind.Unknown;

            public override bool TryGetDiagnosticValue(SyntaxTree tree, string diagnosticId, CancellationToken cancellationToken, out ReportDiagnostic severity)
            {
                severity = reporting;
                return !global && diagnosticId == "CS8019";
            }

            public override bool TryGetGlobalDiagnosticValue(string diagnosticId, CancellationToken cancellationToken, out ReportDiagnostic severity)
            {
                severity = reporting;
                return global && diagnosticId == "CS8019";
            }
        }

        private sealed class GenericMarker<T> { }

        private sealed record ImportCallback(string Namespace, Action Callback) : ValueExpression
        {
            internal override void WriteCore(CodeWriter writer)
            {
                Callback();
                writer.UseNamespace(Namespace);
                writer.AppendRaw("default");
            }
        }
    }
}
