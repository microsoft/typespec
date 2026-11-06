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
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.TestHelpers;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    [NonParallelizable]
    internal partial class PreparedFieldTypeTests
    {
        [SetUp]
        public async Task SetUp() => await MockHelpers.LoadMockGeneratorAsync(
            compilation: () => Task.FromResult<Compilation>(CSharpCompilation.Create("Customization")));

        [Test]
        public void PreparedSameNamespaceFieldIsWrittenWithoutQualification()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type);

            var content = WriteWithPreparedContext(owner, target);

            StringAssert.Contains("private Widget _value;", content);
        }

        [Test]
        public void SameNamespaceReferenceTargetIsPreparedBeforeWriting()
        {
            var reference = CreateExternalWidget("ExternalWidget");
            var compilation = ReferenceCompilation(reference);
            var type = ReferencedWidgetType();
            var owner = new FieldOwner(type);
            var baseline = new TypeProviderWriter(owner).Write().Content;
            using var prepared = PreparedFieldTypes.Create([owner], compilation, _ => true);
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);
            var file = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(file.Content, Does.Contain("private Widget _value;"));
            Assert.That(file.QualifiedContent, Is.EqualTo(baseline));
            Assert.That(ReferenceEquals(owner.Fields[0].Type, type), Is.True);
            var original = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(baseline));
            var candidate = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(file.Content));
            Assert.That(original.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            Assert.That(candidate.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            var originalField = (IFieldSymbol)original.GetTypeByMetadataName("Sample.Clock")!.GetMembers("_value").Single();
            var candidateField = (IFieldSymbol)candidate.GetTypeByMetadataName("Sample.Clock")!.GetMembers("_value").Single();
            Assert.That(candidateField.Type.ToDisplayString(), Is.EqualTo("Sample.Widget"));
            Assert.That(candidateField.Type.ContainingAssembly.Identity, Is.EqualTo(originalField.Type.ContainingAssembly.Identity));
            Assert.That(candidateField.Type.ContainingAssembly.Name, Is.EqualTo("ExternalWidget"));
        }

        [Test]
        public void ReflectionBackedReferenceTargetIsPreparedBeforeWriting()
        {
            var image = CreateExternalWidgetImage("ReflectionWidget");
            var context = new System.Runtime.Loader.AssemblyLoadContext("PreparedReference", isCollectible: true);
            try
            {
                using var stream = new MemoryStream(image);
                var reflected = context.LoadFromStream(stream).GetType("Sample.Widget", throwOnError: true)!;
                var type = new CSharpType(reflected);
                var owner = new FieldOwner(type);
                var compilation = ReferenceCompilation(MetadataReference.CreateFromImage(image));
                var baseline = new TypeProviderWriter(owner).Write().Content;
                using var prepared = PreparedFieldTypes.Create([owner], compilation, _ => true);
                Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);
                var file = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
                Assert.That(file.Content, Does.Contain("private Widget _value;"));
                Assert.That(file.QualifiedContent, Is.EqualTo(baseline));
                var candidate = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(file.Content));
                Assert.That(candidate.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
                var field = (IFieldSymbol)candidate.GetTypeByMetadataName("Sample.Clock")!.GetMembers("_value").Single();
                Assert.That(field.Type.ContainingAssembly.Name, Is.EqualTo("ReflectionWidget"));
            }
            finally { context.Unload(); }
        }

        [Test]
        public void ReferenceTargetNestedShadowRetainsQualificationBeforeWriting()
        {
            var owner = new FieldOwner(ReferencedWidgetType(), nestedShadow: true);
            using var prepared = PreparedFieldTypes.Create([owner], ReferenceCompilation(CreateExternalWidget("ExternalWidget")), _ => true);
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.False);
            Assert.That(new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content,
                Does.Contain("private global::Sample.Widget _value;"));
        }

        [Test]
        public void ReferenceTargetIdentityMutationIsStickyBeforeWriting()
        {
            var type = ReferencedWidgetType();
            var owner = new FieldOwner(type);
            using var prepared = PreparedFieldTypes.Create([owner], ReferenceCompilation(CreateExternalWidget("ExternalWidget")), _ => true);
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);
            type.Namespace = "Other";
            type.Namespace = "Sample";
            Assert.That(prepared.CanCommit(), Is.False);
            Assert.That(new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content,
                Does.Contain("private global::Sample.Widget _value;"));
        }

        [Test]
        public void ReferenceArgumentListMutationPreservesQualifiedGenericSpelling()
        {
            var arguments = new List<CSharpType>();
            var type = new CSharpType("Widget", "Sample", false, false, null, arguments, true, false);
            var owner = new FieldOwner(type);
            var compilation = ReferenceCompilation(CreateExternalWidget("ExternalWidget"));
            using var prepared = PreparedFieldTypes.Create([owner], compilation, _ => true);
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);
            var identityVersion = type.IdentityVersion;

            arguments.Add(new CSharpType(typeof(int)));
            Assert.That(type.IdentityVersion, Is.EqualTo(identityVersion), "The retained list does not notify the type identity version.");
            var baseline = new TypeProviderWriter(owner).Write().Content;
            Assert.That(baseline, Does.Contain("private global::Sample.Widget<int> _value;"));
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.False);
            Assert.That(prepared.CanCommit(), Is.False);
            var file = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(file.Content, Is.EqualTo(baseline));
            Assert.That(file.QualifiedContent, Is.EqualTo(baseline));
            var originalErrors = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(baseline)).GetDiagnostics()
                .Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error).Select(diagnostic => diagnostic.Id).ToArray();
            var candidateErrors = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(file.Content)).GetDiagnostics()
                .Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error).Select(diagnostic => diagnostic.Id).ToArray();
            Assert.That(originalErrors, Does.Contain("CS0308"), "The nongeneric metadata target cannot accept a type argument.");
            Assert.That(candidateErrors, Is.EqualTo(originalErrors), "Preparation must not erase the baseline error.");
        }

        [TestCase("observe")]
        [TestCase("commit")]
        [TestCase("use")]
        public void ObservedReferenceArgumentMutationIsSticky(string boundary)
        {
            var arguments = new List<CSharpType>();
            var type = new CSharpType("Widget", "Sample", false, false, null, arguments, true, false);
            var owner = new FieldOwner(type);
            using var prepared = PreparedFieldTypes.Create([owner], ReferenceCompilation(CreateExternalWidget("ExternalWidget")), _ => true);
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);
            arguments.Add(new CSharpType(typeof(int)));
            switch (boundary)
            {
                case "observe": prepared.ObserveSnapshot(); break;
                case "commit": Assert.That(prepared.CanCommit(), Is.False); break;
                case "use": Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.False); break;
            }
            arguments.Clear();
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.False, "Restoring a retained list cannot reactivate an observed stale decision.");
            Assert.That(prepared.CanCommit(), Is.False);
            Assert.That(new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content,
                Does.Contain("private global::Sample.Widget _value;"));
        }

        [TestCase(false)]
        [TestCase(true)]
        public void ReferenceArgumentMutationDuringWriteUsesFallbackWithoutCallbackReplay(bool afterFieldType)
        {
            var compilation = ReferenceCompilation(CreateExternalWidget("ExternalWidget"));
            (CodeFile File, int Calls, bool Committed) Write(bool enabled)
            {
                var arguments = new List<CSharpType>();
                var type = new CSharpType("Widget", "Sample", false, false, null, arguments, true, false);
                var calls = 0;
                void Mutate() { calls++; arguments.Add(new CSharpType(typeof(int))); }
                var owner = afterFieldType
                    ? new FieldOwner(type, onFieldInitializer: Mutate)
                    : new FieldOwner(type, onFieldAttribute: Mutate);
                using var prepared = enabled ? PreparedFieldTypes.Create([owner], compilation, _ => true) : null;
                if (enabled)
                {
                    Assert.That(prepared!.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);
                }
                var file = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
                return (file, calls, prepared?.CanCommit() ?? false);
            }
            var baseline = Write(false);
            var candidate = Write(true);
            Assert.That(baseline.Calls, Is.EqualTo(1));
            Assert.That(candidate.Calls, Is.EqualTo(1));
            Assert.That(candidate.Committed, Is.False);
            Assert.That(candidate.File.WithoutPreparedNames().Content, Is.EqualTo(baseline.File.Content));
            Assert.That(candidate.File.QualifiedContent, Is.EqualTo(baseline.File.Content));
            if (!afterFieldType)
            {
                Assert.That(candidate.File.Content, Does.Contain("global::Sample.Widget<int>"));
            }
        }

        [Test]
        public void AmbiguousReferenceTargetsRemainQualifiedBeforeWriting()
        {
            var compilation = ReferenceCompilation(CreateExternalWidget("ExternalA"), CreateExternalWidget("ExternalB"));
            var owner = new FieldOwner(ReferencedWidgetType());
            var baseline = new TypeProviderWriter(owner).Write().Content;
            using var prepared = PreparedFieldTypes.Create([owner], compilation, _ => true);
            var content = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content;
            Assert.That(content, Is.EqualTo(baseline));
            Assert.That(content, Does.Contain("private global::Sample.Widget _value;"));
        }

        [Test]
        public void ExternAliasOnlyReferenceTargetRemainsQualifiedBeforeWriting()
        {
            var reference = CreateExternalWidget("ExternalWidget").WithProperties(new MetadataReferenceProperties(aliases: ["External"]));
            var owner = new FieldOwner(ReferencedWidgetType());
            using var prepared = PreparedFieldTypes.Create([owner], ReferenceCompilation(reference), _ => true);
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.False);
            Assert.That(new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content,
                Does.Contain("private global::Sample.Widget _value;"));
        }

        [Test]
        public void ReferenceNamespacePrefixShadowRemainsQualifiedBeforeWriting()
        {
            var compilation = ReferenceCompilation(CreateExternalWidget("ExternalWidget"))
                .AddSyntaxTrees(CSharpSyntaxTree.ParseText("class Sample { public class Widget {} }"));
            var owner = new FieldOwner(ReferencedWidgetType());
            using var prepared = PreparedFieldTypes.Create([owner], compilation, _ => true);
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.False);
            Assert.That(new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content,
                Does.Contain("private global::Sample.Widget _value;"));
        }

        private static CSharpType ReferencedWidgetType() => new("Widget", "Sample", false, false, null, [], true, false);

        private static CSharpCompilation ReferenceCompilation(params MetadataReference[] references) => CSharpCompilation.Create("PreparedReferenceFields",
            references: new[] { MetadataReference.CreateFromFile(typeof(object).Assembly.Location) }.Concat(references),
            options: new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

        private static PortableExecutableReference CreateExternalWidget(string name) => MetadataReference.CreateFromImage(CreateExternalWidgetImage(name));

        private static byte[] CreateExternalWidgetImage(string name)
        {
            var compilation = CSharpCompilation.Create(name,
                [CSharpSyntaxTree.ParseText("namespace Sample { public class Widget {} }")],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            using var stream = new MemoryStream();
            var emit = compilation.Emit(stream);
            Assert.That(emit.Success, Is.True, string.Join("\n", emit.Diagnostics));
            return stream.ToArray();
        }

        [Test]
        public void UnpreparedFieldRetainsQualification()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type);

            var content = new TypeProviderWriter(owner).Write().Content;

            StringAssert.Contains("private global::Sample.Widget _value;", content);
        }

        [Test]
        public void NormalImportFieldPreservesCapturedQualification()
        {
            var target = Target("Other");
            var owner = new FieldOwner(target.Type);
            var baseline = new TypeProviderWriter(owner).Write().Content;
            using var prepared = PreparedFieldTypes.Create([owner, target], CurrentCompilation, _ => true);
            var file = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();

            // Task 02 intentionally extends the original same-namespace boundary;
            // retain its exact qualified representation as the fallback anchor.
            StringAssert.Contains("private global::Other.Widget _value;", file.QualifiedContent);
            Assert.That(file.QualifiedContent, Is.EqualTo(baseline));
            StringAssert.Contains("private Widget _value;", file.Content);
            var targetCode = new TypeProviderWriter(target).Write().Content;
            Assert.That(CompileField(file.Content, targetCode), Is.EqualTo(CompileField(baseline, targetCode)));
        }

        [Test]
        public void QualifiedVariantMatchesLegacyWriterIncludingUsingsAndOtherOccurrences()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type, includeProperty: true, includeFrameworkField: true);
            var legacy = new TypeProviderWriter(owner).Write().Content;
            using var prepared = PreparedFieldTypes.Create([owner, target], CurrentCompilation, _ => true);
            var file = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();

            StringAssert.Contains("private Widget _value;", file.Content);
            StringAssert.Contains("using System;", file.Content);
            Assert.That(file.QualifiedContent, Is.EqualTo(legacy));
            StringAssert.Contains("global::Sample.Widget Other", file.Content);
        }

        [Test]
        public void FieldOccurrenceDoesNotChangeSharedPropertyType()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type, includeProperty: true);

            var content = WriteWithPreparedContext(owner, target);

            StringAssert.Contains("private Widget _value;", content);
            StringAssert.Contains("global::Sample.Widget Other", content);
        }

        [Test]
        public void ExplicitGeneratedPartialPartsSharePreparedScopeAndBinding()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type);
            var part = new KnownPartial(owner, target.Type);
            using var prepared = PreparedFieldTypes.Create([owner, part, target], CurrentCompilation, _ => true);
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);
            Assert.That(prepared.CanWriteSimpleName(part, part.Fields[0]), Is.True);
            var ownerCode = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content;
            var partCode = new TypeProviderWriter(part) { PreparedFieldTypes = prepared }.Write().Content;
            Assert.That(ownerCode, Does.Contain("private Widget _value;"));
            Assert.That(partCode, Does.Contain("private Widget _restValue;"));
            Assert.That(CompileField(ownerCode, new TypeProviderWriter(target).Write().Content, partCode), Is.EqualTo("Sample.Widget"));
            Assert.That(ReferenceEquals(owner.Fields[0].Type, target.Type), Is.True);
            Assert.That(ReferenceEquals(part.Fields[0].Type, target.Type), Is.True);
        }

        [Test]
        public void ExplicitGeneratedPartialShadowRetainsBothQualifiedSpellings()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type);
            var part = new KnownPartial(owner, target.Type, shadow: true);
            using var prepared = PreparedFieldTypes.Create([owner, part, target], CurrentCompilation, _ => true);
            var ownerCode = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content;
            var partCode = new TypeProviderWriter(part) { PreparedFieldTypes = prepared }.Write().Content;
            Assert.That(ownerCode, Does.Contain("private global::Sample.Widget _value;"));
            Assert.That(partCode, Does.Contain("private global::Sample.Widget _restValue;"));
            Assert.That(CompileField(ownerCode, new TypeProviderWriter(target).Write().Content, partCode), Is.EqualTo("Sample.Widget"));
        }

        [Test]
        public void NewGeneratedPartialRegistrationInvalidatesPreparedNames()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type);
            using var prepared = PreparedFieldTypes.Create([owner, target], CurrentCompilation, _ => true);
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);
            _ = new KnownPartial(owner, target.Type);
            Assert.That(prepared.CanCommit(), Is.False);
            Assert.That(new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content,
                Does.Contain("private global::Sample.Widget _value;"));
        }

        [Test]
        public void UnregisteredThirdPartialCannotJoinAnExplicitGroup()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type);
            var known = new KnownPartial(owner, target.Type);
            var unknown = new KnownPartial(owner, target.Type, register: false, suffix: "Other");
            using var prepared = PreparedFieldTypes.Create([owner, known, unknown, target], CurrentCompilation, _ => true);
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.False);
            Assert.That(new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content,
                Does.Contain("private global::Sample.Widget _value;"));
        }

        [Test]
        public void RelatedSerializationPartSharesTheProvenOwnerScope()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type, hasSerialization: true);
            var serialization = owner.SerializationProviders[0];
            using var prepared = PreparedFieldTypes.Create([owner, target], CurrentCompilation, _ => true);
            var ownerCode = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content;
            var serializationCode = new TypeProviderWriter(serialization) { PreparedFieldTypes = prepared }.Write().Content;

            StringAssert.Contains("private Widget _value;", ownerCode);
            StringAssert.Contains("private Widget _serializedValue;", serializationCode);
            Assert.That(CompileField(ownerCode, new TypeProviderWriter(target).Write().Content, serializationCode), Is.EqualTo("Sample.Widget"));
        }

        [Test]
        public void MultipleRelatedSerializationPartsShareTheOwnerScope()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type, hasSerialization: true, twoSerializations: true);
            using var prepared = PreparedFieldTypes.Create([owner, target], CurrentCompilation, _ => true);
            var ownerCode = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content;
            var first = new TypeProviderWriter(owner.SerializationProviders[0]) { PreparedFieldTypes = prepared }.Write().Content;
            var second = new TypeProviderWriter(owner.SerializationProviders[1]) { PreparedFieldTypes = prepared }.Write().Content;

            StringAssert.Contains("private Widget _value;", ownerCode);
            StringAssert.Contains("private Widget _serializedValue;", first);
            StringAssert.Contains("private Widget _serializedValue2;", second);
            Assert.That(CompileField(ownerCode, new TypeProviderWriter(target).Write().Content, first, second), Is.EqualTo("Sample.Widget"));
        }

        [Test]
        public void RelatedSerializationPartOfTargetDoesNotLoseItsIdentity()
        {
            var target = new SerializableWidget();
            var owner = new FieldOwner(target.Type);
            using var prepared = PreparedFieldTypes.Create([owner, target], CurrentCompilation, _ => true);
            var ownerCode = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content;
            var serializationCode = new TypeProviderWriter(target.SerializationProviders[0]).Write().Content;

            StringAssert.Contains("private Widget _value;", ownerCode);
            Assert.That(CompileField(ownerCode, new TypeProviderWriter(target).Write().Content, serializationCode), Is.EqualTo("Sample.Widget"));
        }

        [Test]
        public void SerializationPartNestedShadowRetainsQualificationForEveryPart()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type, hasSerialization: true, serializationShadow: true);
            var serialization = owner.SerializationProviders[0];
            using var prepared = PreparedFieldTypes.Create([owner, target], CurrentCompilation, _ => true);
            var ownerCode = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content;
            var serializationCode = new TypeProviderWriter(serialization) { PreparedFieldTypes = prepared }.Write().Content;

            StringAssert.Contains("private global::Sample.Widget _value;", ownerCode);
            StringAssert.Contains("private global::Sample.Widget _serializedValue;", serializationCode);
            Assert.That(CompileField(ownerCode, new TypeProviderWriter(target).Write().Content, serializationCode), Is.EqualTo("Sample.Widget"));
        }

        [Test]
        public void MutableSerializerPartScopeIsRevalidatedForTheOwner()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type, hasSerialization: true);
            var serialization = owner.SerializationProviders[0];
            var nested = new List<TypeProvider>();
            serialization.Update(nestedTypes: nested);
            using var prepared = PreparedFieldTypes.Create([owner, target], CurrentCompilation, _ => true);
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);

            nested.Add(new Shadow(serialization));
            var ownerCode = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content;
            var serializationCode = new TypeProviderWriter(serialization) { PreparedFieldTypes = prepared }.Write().Content;
            StringAssert.Contains("private global::Sample.Widget _value;", ownerCode);
            Assert.That(CompileField(ownerCode, new TypeProviderWriter(target).Write().Content, serializationCode), Is.EqualTo("Sample.Widget"));
        }

        [Test]
        public void GeneratedNestedTypeShadowRetainsQualification()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type, nestedShadow: true);

            var content = WriteWithPreparedContext(owner, target);

            StringAssert.Contains("private global::Sample.Widget _value;", content);
        }

        [Test]
        public void InheritedAndGenericOwnerScopesRetainQualification()
        {
            var target = Target();
            foreach (var owner in new[]
            {
                new FieldOwner(target.Type, inherited: true),
                new FieldOwner(target.Type, genericOwner: true),
                new FieldOwner(target.Type, fieldName: "Widget")
            })
            {
                var baseline = new TypeProviderWriter(owner).Write().Content;
                Assert.That(WriteWithPreparedContext(owner, target), Is.EqualTo(baseline));
                StringAssert.Contains("global::Sample.Widget", baseline);
            }
        }

        [Test]
        public void NullableAndArrayFieldTypesRetainExistingSpelling()
        {
            var target = Target();
            foreach (var type in new[] { target.Type.WithNullable(true), new CSharpType(typeof(int[])) })
            {
                var owner = new FieldOwner(type);
                var baseline = new TypeProviderWriter(owner).Write().Content;
                Assert.That(WriteWithPreparedContext(owner, target), Is.EqualTo(baseline));
            }
        }

        [Test]
        public void AttributeDefinitionCannotAssumeNoCustomPartialFromItsCustomView()
        {
            var compilation = CompilationWith("namespace Sample { partial class Clock { class Widget {} } }");
            var target = Target();
            var owner = new AttributeOwner(target.Type);
            using var prepared = PreparedFieldTypes.Create([owner, target], compilation, _ => true);
            var content = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content;

            StringAssert.Contains("private global::Sample.Widget _value;", content);
            Assert.That(CompileField(content, new TypeProviderWriter(target).Write().Content,
                "namespace Sample { partial class Clock { class Widget {} } }"), Is.EqualTo("Sample.Widget"));
        }

        [Test]
        public void FieldAttributeMutationCannotInvalidateAnAlreadySelectedSpelling()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type, mutateFieldAttribute: true);
            using var prepared = PreparedFieldTypes.Create([owner, target], CurrentCompilation, _ => true);
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);

            var content = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content;

            StringAssert.Contains("private global::Sample.Widget _value;", content);
            Assert.That(CompileField(content, new TypeProviderWriter(target).Write().Content), Is.EqualTo("Sample.Widget"));
        }

        [Test]
        public async Task HandwrittenPartialNestedTypeShadowRetainsQualification()
        {
            const string source = "namespace Sample { partial class Clock { class Widget {} } }";
            var compilation = CompilationWith(source);
            await MockHelpers.LoadMockGeneratorAsync(compilation: () => Task.FromResult<Compilation>(compilation));
            var target = Target();
            var owner = new FieldOwner(target.Type);

            var content = WriteWithPreparedContext(owner, target);

            StringAssert.Contains("private global::Sample.Widget _value;", content);
        }

        [TestCase("global using Alias = Sample.Widget;")]
        [TestCase("#if OTHER\nnamespace Sample { partial class Clock { class Widget {} } }\n#endif")]
        [TestCase("namespace Sample {")]
        public void UnsupportedSourceRetainsQualification(string source)
        {
            var target = Target();
            var owner = new FieldOwner(target.Type);

            var content = WriteWithPreparedContext(owner, target, CompilationWith(source));

            StringAssert.Contains("private global::Sample.Widget _value;", content);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task KnownCustomPartialScopeWithoutShadowIsPrepared(bool loadAsCustomSource)
        {
            const string source = "namespace Sample { partial class Clock { public Clock() {} public string Label { get; } public void Touch<Widget>() {} } }";
            var compilation = CompilationWith(source);
            if (loadAsCustomSource)
            {
                await MockHelpers.LoadMockGeneratorAsync(compilation: () => Task.FromResult<Compilation>(compilation));
            }
            var target = Target();
            var owner = new FieldOwner(target.Type);
            using var prepared = PreparedFieldTypes.Create([owner, target], compilation, _ => true);
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);
            var file = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(file.Content, Does.Contain("private Widget _value;"));
            Assert.That(CompileField(file.Content, new TypeProviderWriter(target).Write().Content, source), Is.EqualTo("Sample.Widget"));
            Assert.That(ReferenceEquals(owner.Fields[0].Type, target.Type), Is.True);
        }

        [Test]
        public void KnownSourcePartialInheritedScopeRetainsQualification()
        {
            const string source = "namespace Sample { public class ForeignBase { public class Widget {} } partial class Clock : ForeignBase {} }";
            var target = Target();
            var owner = new FieldOwner(target.Type);
            var content = WriteWithPreparedContext(owner, target, CompilationWith(source));
            Assert.That(content, Does.Contain("private global::Sample.Widget _value;"));
            Assert.That(CompileField(content, new TypeProviderWriter(target).Write().Content, source), Is.EqualTo("Sample.Widget"));
        }

        [TestCase(false)]
        [TestCase(true)]
        public void GeneratedTargetMetadataPrefixTypeRetainsRawQualificationAndDiagnostics(bool rootPrefix)
        {
            var (owner, target, compilation) = GeneratedTargetWithMetadataPrefix(rootPrefix);
            var canonical = target.Type;
            var baseline = new TypeProviderWriter(owner).Write().Content;
            using var prepared = PreparedFieldTypes.Create([owner, target], compilation, _ => true);
            var candidate = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content;
            var targetCode = new TypeProviderWriter(target).Write().Content;
            var before = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(baseline), CSharpSyntaxTree.ParseText(targetCode));
            var after = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(candidate), CSharpSyntaxTree.ParseText(targetCode));

            Assert.Multiple(() =>
            {
                Assert.That(before.GetDiagnostics().Any(d => d.Id == "CS0435" && d.Severity == DiagnosticSeverity.Error), Is.True,
                    "The qualified raw baseline must preserve the reported namespace/type conflict, promoted to an error.");
                Assert.That(DiagnosticSignatures(after), Is.EqualTo(DiagnosticSignatures(before)));
                Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.False);
                Assert.That(candidate, Is.EqualTo(baseline));
                Assert.That(candidate, Does.Contain("private global::Root.Sub.Widget _value;"));
                Assert.That(owner.Fields[0].Type, Is.SameAs(canonical));
                Assert.That(target.Type, Is.SameAs(canonical));
            });
        }

        [Test]
        public void GeneratedTargetProviderPrefixTypeRetainsRawQualificationAndDiagnostics()
        {
            var target = Target("Root.Sub");
            var owner = new FieldOwner(target.Type);
            owner.Type.Namespace = target.Type.Namespace;
            var prefixType = new TestTypeProvider(name: "Sub", ns: "Root",
                declarationModifiers: TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class);
            var baseline = new TypeProviderWriter(owner).Write().Content;
            using var prepared = PreparedFieldTypes.Create([owner, target, prefixType], CurrentCompilation, _ => true);
            var candidate = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content;
            var declarations = new[] { target, prefixType }.Select(provider =>
                CSharpSyntaxTree.ParseText(new TypeProviderWriter(provider).Write().Content)).ToArray();
            var before = ReferenceCompilation().AddSyntaxTrees(declarations.Append(CSharpSyntaxTree.ParseText(baseline)));
            var after = ReferenceCompilation().AddSyntaxTrees(declarations.Append(CSharpSyntaxTree.ParseText(candidate)));

            Assert.Multiple(() =>
            {
                Assert.That(before.GetDiagnostics().Any(d => d.Severity == DiagnosticSeverity.Error), Is.True);
                Assert.That(DiagnosticSignatures(after), Is.EqualTo(DiagnosticSignatures(before)));
                Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.False);
                Assert.That(candidate, Is.EqualTo(baseline));
                Assert.That(owner.Fields[0].Type, Is.SameAs(target.Type));
            });
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task GeneratedTargetMetadataPrefixTypeMatchesExistingResidualDiagnostics(bool rootPrefix)
        {
            var (owner, target, compilation) = GeneratedTargetWithMetadataPrefix(rootPrefix);
            var baseline = new TypeProviderWriter(owner).Write();
            using var prepared = PreparedFieldTypes.Create([owner, target], compilation, _ => true);
            var candidate = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            var targetCode = new TypeProviderWriter(target).Write();

            async Task<string> Reduce(CodeFile ownerCode)
            {
                GeneratedCodeWorkspace.Initialize();
                var snapshot = new CompleteSourceInputSnapshot(CodeModelGenerator.Instance.Configuration.OutputDirectory,
                    "metadata-prefix-test", compilation, ["fixture"], () => true, parseOptions: CSharpParseOptions.Default);
                var workspace = await GeneratedCodeWorkspace.CreateForCompilerProof(snapshot);
                await workspace.AddGeneratedFile(ownerCode);
                await workspace.AddGeneratedFile(targetCode);
                await foreach (var file in workspace.GetGeneratedFilesAsync())
                {
                    if (file.Name == ownerCode.Name)
                    {
                        return file.Text;
                    }
                }
                throw new InvalidOperationException("The metadata-prefix field owner was not emitted.");
            }

            var beforeCode = await Reduce(baseline);
            var afterCode = await Reduce(candidate);
            var before = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(beforeCode), CSharpSyntaxTree.ParseText(targetCode.Content));
            var after = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(afterCode), CSharpSyntaxTree.ParseText(targetCode.Content));
            TestContext.WriteLine($"Residual metadata-prefix diagnostics: {string.Join(", ", DiagnosticSignatures(before))}");
            Assert.That(afterCode, Is.EqualTo(beforeCode));
            Assert.That(DiagnosticSignatures(after), Is.EqualTo(DiagnosticSignatures(before)));
        }

        [Test]
        public void SourceNamespacePrefixTypeCannotAuthorizeGeneratedTargetShortening()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type);
            var content = WriteWithPreparedContext(owner, target, CompilationWith("class Sample { public class Widget {} }"));
            Assert.That(content, Does.Contain("private global::Sample.Widget _value;"));
        }

        [Test]
        public void NonPartialSourceOwnerRemainsUnsupported()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type);
            var content = WriteWithPreparedContext(owner, target, CompilationWith("namespace Sample { class Clock {} }"));
            Assert.That(content, Does.Contain("private global::Sample.Widget _value;"));
        }

        [Test]
        public void MissingSourceFactsRetainQualification()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type);
            using var prepared = PreparedFieldTypes.Create([owner, target], null, _ => true);
            var writer = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared };

            StringAssert.Contains("private global::Sample.Widget _value;", writer.Write().Content);
        }

        [Test]
        public void DuplicateTargetIdentityAndUnprovenTypeIdentityRetainQualification()
        {
            var target = Target();
            var duplicate = Target();
            var owner = new FieldOwner(target.Type);
            using (var prepared = PreparedFieldTypes.Create([owner, target, duplicate], CurrentCompilation, _ => true))
            {
                var writer = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared };
                StringAssert.Contains("private global::Sample.Widget _value;", writer.Write().Content);
            }

            var reconstructed = new CSharpType("Widget", "Sample", false, false, null, [], false, false);
            var otherOwner = new FieldOwner(reconstructed);
            StringAssert.Contains("private global::Sample.Widget _value;", WriteWithPreparedContext(otherOwner, target));
        }

        [Test]
        public void ConflictingOutputFilePathsMakeProviderFactsUnavailable()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type);
            var conflictingOutput = new ClockPathCollision();
            using var prepared = PreparedFieldTypes.Create([owner, target, conflictingOutput], CurrentCompilation, _ => true);

            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.False);
        }

        [Test]
        public void SymlinkedOutputPathsCannotConcealAFileCollision()
        {
            var directory = Path.Combine(Path.GetTempPath(), "typespec-field-paths", Guid.NewGuid().ToString("N"));
            var actualDirectory = Path.Combine(directory, "actual");
            Directory.CreateDirectory(actualDirectory);
            try
            {
                try
                {
                    Directory.CreateSymbolicLink(Path.Combine(directory, "linked"), actualDirectory);
                }
                catch (Exception exception) when (exception is PlatformNotSupportedException or UnauthorizedAccessException or IOException)
                {
                    Assert.Ignore("Symbolic links are not available in this test environment.");
                }
                var target = Target();
                var owner = new FieldOwner(target.Type, relativePath: Path.Combine("actual", "Clock.cs"));
                var collision = new ClockPathCollision(Path.Combine("linked", "Clock.cs"));
                using var prepared = PreparedFieldTypes.Create([owner, target, collision], CurrentCompilation, _ => true, directory);

                Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.False);
            }
            finally
            {
                Directory.Delete(directory, recursive: true);
            }
        }

        [Test]
        public void SymlinkIntroducedAfterPreparationInvalidatesTheSnapshot()
        {
            var directory = Path.Combine(Path.GetTempPath(), "typespec-field-paths", Guid.NewGuid().ToString("N"));
            var actualDirectory = Path.Combine(directory, "actual");
            var otherDirectory = Path.Combine(directory, "other");
            Directory.CreateDirectory(actualDirectory);
            Directory.CreateDirectory(otherDirectory);
            try
            {
                var target = Target();
                var owner = new FieldOwner(target.Type, relativePath: Path.Combine("actual", "Clock.cs"));
                var collision = new ClockPathCollision(Path.Combine("other", "Clock.cs"));
                using var prepared = PreparedFieldTypes.Create([owner, target, collision], CurrentCompilation, _ => true, directory);
                Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);

                Directory.Delete(otherDirectory);
                try
                {
                    Directory.CreateSymbolicLink(otherDirectory, actualDirectory);
                }
                catch (Exception exception) when (exception is PlatformNotSupportedException or UnauthorizedAccessException or IOException)
                {
                    Assert.Ignore("Symbolic links are not available in this test environment.");
                }
                Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.False);
                Assert.That(prepared.CanCommit(), Is.False);
            }
            finally
            {
                Directory.Delete(directory, recursive: true);
            }
        }

        [Test]
        public void ReusedFieldProviderDoesNotStandInForTwoOccurrences()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type);
            var field = owner.Fields[0];
            owner.Update(fields: [field, field]);
            using var prepared = PreparedFieldTypes.Create([owner, target], CurrentCompilation, _ => true);

            Assert.That(prepared.CanWriteSimpleName(owner, field), Is.False);
        }

        [Test]
        public void RemovedTargetRetainsQualification()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type);
            using var prepared = PreparedFieldTypes.Create([owner, target], CurrentCompilation, provider => !ReferenceEquals(provider, target));
            var writer = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared };

            StringAssert.Contains("private global::Sample.Widget _value;", writer.Write().Content);
        }

        [TestCase("observe")]
        [TestCase("use")]
        [TestCase("commit")]
        public void ObservedNestedListMutationIsSticky(string boundary)
        {
            var target = Target();
            var owner = new FieldOwner(target.Type);
            var nested = new List<TypeProvider>();
            owner.Update(nestedTypes: nested);
            using var prepared = PreparedFieldTypes.Create([owner, target], CurrentCompilation, _ => true);
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);

            nested.Add(new Shadow(owner));
            switch (boundary)
            {
                case "observe": prepared.ObserveSnapshot(); break;
                case "use": Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.False); break;
                case "commit": Assert.That(prepared.CanCommit(), Is.False); break;
            }
            nested.Clear();

            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.False,
                "Restoring a retained collection must not resurrect preparation after observed divergence.");
            Assert.That(prepared.CanCommit(), Is.False);
        }

        [Test]
        public void CommitFinalSnapshotDivergenceIsSticky()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type);
            var nested = new List<TypeProvider>();
            owner.Update(nestedTypes: nested);
            var armed = false;
            var snapshotChecks = 0;
            using var prepared = PreparedFieldTypes.Create([owner, target], CurrentCompilation, provider =>
            {
                // A commit checks the provider snapshot before field use, during
                // field observation, and finally after all candidate uses.
                if (armed && ReferenceEquals(provider, target) && ++snapshotChecks == 3)
                {
                    nested.Add(new Shadow(owner));
                }
                return true;
            });
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);

            armed = true;
            Assert.That(prepared.CanCommit(), Is.False);
            Assert.That(snapshotChecks, Is.EqualTo(3), "Divergence must be observed by the final commit snapshot check.");
            armed = false;
            nested.Clear();

            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.False);
            Assert.That(prepared.CanCommit(), Is.False);
        }

        [TestCase(1)]
        [TestCase(2)]
        [TestCase(3)]
        [TestCase(4)]
        public void CommitObservesEachSnapshotBoundaryWithMultipleCandidates(int divergentCheck)
        {
            var target = Target();
            var owner = new FieldOwner(target.Type);
            owner.Update(fields: [owner.Fields[0], new FieldProvider(FieldModifiers.Private, target.Type, "_other", owner)]);
            var nested = new List<TypeProvider>();
            owner.Update(nestedTypes: nested);
            var armed = false;
            var snapshotChecks = 0;
            using var prepared = PreparedFieldTypes.Create([owner, target], CurrentCompilation, provider =>
            {
                if (armed && ReferenceEquals(provider, target) && ++snapshotChecks == divergentCheck)
                {
                    nested.Add(new Shadow(owner));
                }
                return true;
            });
            Assert.That(prepared.CanCommit(), Is.True);

            armed = true;
            Assert.That(prepared.CanCommit(), Is.False);
            Assert.That(snapshotChecks, Is.EqualTo(divergentCheck),
                "Commit must observe the initial, each occurrence, and final snapshot boundaries.");
            armed = false;
            nested.Clear();

            Assert.That(prepared.CanCommit(), Is.False, "Restoring a retained list must not resurrect the plan.");
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.False);
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[1]), Is.False);
        }

        [Test]
        public void MutableNestedTypeListCannotChangeFieldBindingAfterPreparation()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type);
            var nested = new List<TypeProvider>();
            owner.Update(nestedTypes: nested);
            using var prepared = PreparedFieldTypes.Create([owner, target], CurrentCompilation, _ => true);
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);

            nested.Add(new Shadow(owner));
            var content = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content;
            var targetCode = new TypeProviderWriter(target).Write().Content;

            StringAssert.Contains("private global::Sample.Widget _value;", content);
            Assert.That(CompileField(content, targetCode), Is.EqualTo("Sample.Widget"));
        }

        [Test]
        public void StandaloneProviderWithNestedMetadataCannotHideAnotherPartialDeclaration()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type);
            var other = new UnexpectedStandalonePartial();
            using var prepared = PreparedFieldTypes.Create([owner, target, other], CurrentCompilation, _ => true);
            var content = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content;
            var targetCode = new TypeProviderWriter(target).Write().Content;
            var otherCode = new TypeProviderWriter(other).Write().Content;

            StringAssert.Contains("private global::Sample.Widget _value;", content);
            Assert.That(CompileField(content, targetCode, otherCode), Is.EqualTo("Sample.Widget"));
        }

        [TestCase(true)]
        [TestCase(false)]
        public void InPlaceTypeNamespaceMutationInvalidatesPreparedName(bool mutateTarget)
        {
            var target = Target();
            var owner = new FieldOwner(target.Type);
            using var prepared = PreparedFieldTypes.Create([owner, target], CurrentCompilation, _ => true);
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);

            if (mutateTarget)
            {
                target.Type.Namespace = "Other";
            }
            else
            {
                owner.Type.Namespace = "Other";
            }
            var content = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content;
            var expected = mutateTarget ? "Other.Widget" : "Sample.Widget";

            StringAssert.Contains($"private global::{expected} _value;", content);
            Assert.That(CompileField(content, new TypeProviderWriter(target).Write().Content), Is.EqualTo(expected));
        }

        [Test]
        public void InPlaceCompetingPartialIdentityMutationInvalidatesPreparedName()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type);
            var competitor = new StandaloneClockWithShadow();
            competitor.Type.Namespace = "Other";
            using var prepared = PreparedFieldTypes.Create([owner, target, competitor], CurrentCompilation, _ => true);
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);

            competitor.Type.Namespace = "Sample";
            var content = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content;
            StringAssert.Contains("private global::Sample.Widget _value;", content);
            Assert.That(CompileField(content, new TypeProviderWriter(target).Write().Content,
                new TypeProviderWriter(competitor).Write().Content), Is.EqualTo("Sample.Widget"));
        }

        [Test]
        public void MutableSerializerListCannotIntroduceAnUnseenPartial()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type);
            var host = new TestTypeProvider(name: "Host", ns: "Other");
            var serializations = new List<TypeProvider>();
            host.Update(serializations: serializations);
            using var prepared = PreparedFieldTypes.Create([owner, target, host], CurrentCompilation, _ => true);
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);

            var latePartial = new StandaloneClockWithShadow();
            serializations.Add(latePartial);
            var content = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content;
            StringAssert.Contains("private global::Sample.Widget _value;", content);
            Assert.That(CompileField(content, new TypeProviderWriter(target).Write().Content,
                new TypeProviderWriter(latePartial).Write().Content), Is.EqualTo("Sample.Widget"));
        }

        [Test]
        public void ProviderMutationInvalidatesAllPreparedOccurrences()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type);
            var competitor = new TestTypeProvider(name: "Other", ns: "Sample", declarationModifiers: TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class);
            using var prepared = PreparedFieldTypes.Create([owner, target, competitor], CurrentCompilation, _ => true);
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);

            competitor.Update(name: "Widget");

            var writer = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared };
            StringAssert.Contains("private global::Sample.Widget _value;", writer.Write().Content);
        }

        [Test]
        public void CompetingSessionsAndExceptionCleanupFailClosed()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type);
            using (var first = PreparedFieldTypes.Create([owner, target], CurrentCompilation, _ => true))
            {
                using var second = PreparedFieldTypes.Create([owner, target], CurrentCompilation, _ => true);
                Assert.That(first.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);
                Assert.That(second.CanWriteSimpleName(owner, owner.Fields[0]), Is.False);
            }

            Assert.Throws<InvalidOperationException>(() =>
            {
                using var session = PreparedFieldTypes.Create([owner, target], CurrentCompilation, _ => true);
                Assert.That(session.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);
                throw new InvalidOperationException();
            });
            using var next = PreparedFieldTypes.Create([owner, target], CurrentCompilation, _ => true);
            Assert.That(next.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);
        }

        [Test]
        public void FieldMutationAndDisposalInvalidatePreparation()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type);
            var prepared = PreparedFieldTypes.Create([owner, target], CurrentCompilation, _ => true);
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);

            owner.Fields[0].Update(name: "_renamed");
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.False);
            prepared.Dispose();

            using var next = PreparedFieldTypes.Create([owner, target], CurrentCompilation, _ => true);
            Assert.That(next.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);
            next.Dispose();
            Assert.That(next.CanWriteSimpleName(owner, owner.Fields[0]), Is.False);
        }

        [TestCase("{}", false)]
        [TestCase("{\"enable-pre-emission-simplification\": true}", true)]
        [TestCase("{\"enable-pre-emission-simplification\": true, \"disable-roslyn-reduce\": true}", false)]
        public void GenerationPolicyIsExplicitAndIndependentOfDisableRoslynReduce(string json, bool enabled)
        {
            var generator = CreateGenerator(json);
            var target = Target();
            var owner = new FieldOwner(target.Type);
            using var prepared = PreparedFieldTypes.CreateForGeneration(generator, [owner, target], _ => true);

            Assert.That(prepared is not null, Is.EqualTo(enabled));
            if (prepared is not null)
            {
                Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);
            }
        }

        [Test]
        public void UnknownSourceCompletenessCannotExcludeLinkedPartialShadowing()
        {
            var generator = CreateGenerator("{\"enable-pre-emission-simplification\": true}", complete: false);
            var target = Target();
            var owner = new FieldOwner(target.Type);
            using var prepared = PreparedFieldTypes.CreateForGeneration(generator, [owner, target], _ => true);
            var content = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content;
            const string linkedSource = "namespace Sample { partial class Clock { class Widget {} } }";
            var targetCode = new TypeProviderWriter(target).Write().Content;

            StringAssert.Contains("private global::Sample.Widget _value;", content);
            Assert.That(CompileField(content, targetCode, linkedSource), Is.EqualTo("Sample.Widget"));
        }

        [Test]
        public void CompleteProofCompilationCanBeIndependentOfCustomizationWorkspace()
        {
            var generator = CreateGenerator("{\"enable-pre-emission-simplification\": true}", complete: false);
            var proofCompilation = CSharpCompilation.Create("CompleteBuildInputs");
            generator.SourceInputModel.PreEmissionSourceInputs = new CompleteSourceInputSnapshot(
                generator.Configuration.OutputDirectory, "controlled-proof-epoch", proofCompilation,
                ["controlled-build"], () => true);
            var target = Target();
            var owner = new FieldOwner(target.Type);

            using var prepared = PreparedFieldTypes.CreateForGeneration(generator, [owner, target], _ => true);

            Assert.That(prepared, Is.Not.Null);
            Assert.That(prepared!.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);
            StringAssert.Contains("private Widget _value;", new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content);
        }

        [Test]
        public void SeparateProofCompilationDetectsLinkedPartialOutsideCustomizationWorkspace()
        {
            var generator = CreateGenerator("{\"enable-pre-emission-simplification\": true}", complete: false);
            var proofCompilation = CompilationWith("namespace Sample { partial class Clock { class Widget {} } }");
            generator.SourceInputModel.PreEmissionSourceInputs = new CompleteSourceInputSnapshot(
                generator.Configuration.OutputDirectory, "controlled-proof-epoch", proofCompilation,
                ["controlled-build"], () => true);
            var target = Target();
            var owner = new FieldOwner(target.Type);

            using var prepared = PreparedFieldTypes.CreateForGeneration(generator, [owner, target], _ => true);
            var content = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().Content;

            StringAssert.Contains("private global::Sample.Widget _value;", content);
            Assert.That(CompileField(content, new TypeProviderWriter(target).Write().Content,
                "namespace Sample { partial class Clock { class Widget {} } }"), Is.EqualTo("Sample.Widget"));
        }

        [Test]
        public void DisabledPolicyDoesNotInspectAnAmbiguousWriterFactory()
        {
            var generator = new OverloadedWriterGenerator(new GeneratorContext(Configuration.Load(TestContext.CurrentContext.WorkDirectory, "{}")))
            {
                SourceInputModel = new SourceInputModel(CurrentCompilation, null)
            };
            var target = Target();
            var owner = new FieldOwner(target.Type);

            using var prepared = PreparedFieldTypes.CreateForGeneration(generator, [owner, target], _ => true);
            Assert.That(prepared, Is.Null);
        }

        [Test]
        public void EnabledPolicyIgnoresUnrelatedGenericWriterOverloads()
        {
            var configuration = Configuration.Load(TestContext.CurrentContext.WorkDirectory,
                "{\"enable-pre-emission-simplification\": true}");
            var generator = new OverloadedWriterGenerator(new GeneratorContext(configuration))
            {
                SourceInputModel = ControlledSourceInput(configuration)
            };
            var target = Target();
            var owner = new FieldOwner(target.Type);

            using var prepared = PreparedFieldTypes.CreateForGeneration(generator, [owner, target], _ => true);
            Assert.That(prepared, Is.Not.Null);
            Assert.That(prepared!.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);
        }

        [Test]
        public void CustomRewriterAndWriterFactoryDisablePreparation()
        {
            const string json = "{\"enable-pre-emission-simplification\": true}";
            var generator = CreateGenerator(json);
            generator.AddRewriter(new TestRewriter());
            var target = Target();
            var owner = new FieldOwner(target.Type);
            using var withRewriter = PreparedFieldTypes.CreateForGeneration(generator, [owner, target], _ => true);
            Assert.That(withRewriter, Is.Null);

            var configuration = Configuration.Load(TestContext.CurrentContext.WorkDirectory, json);
            var customWriterGenerator = new CustomWriterGenerator(new GeneratorContext(configuration))
            {
                SourceInputModel = ControlledSourceInput(configuration)
            };
            using var withCustomWriter = PreparedFieldTypes.CreateForGeneration(customWriterGenerator, [owner, target], _ => true);
            Assert.That(withCustomWriter, Is.Null);
        }

        [Test]
        public void StaleOrReplacedSourceSnapshotFailsClosed()
        {
            const string json = "{\"enable-pre-emission-simplification\": true}";
            var configuration = Configuration.Load(TestContext.CurrentContext.WorkDirectory, json);
            var current = true;
            var source = ControlledSourceInput(configuration, () => current);
            var generator = new PolicyGenerator(new GeneratorContext(configuration)) { SourceInputModel = source };
            var target = Target();
            var owner = new FieldOwner(target.Type);

            using (var prepared = PreparedFieldTypes.CreateForGeneration(generator, [owner, target], _ => true))
            {
                Assert.That(prepared, Is.Not.Null);
                Assert.That(prepared!.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);
                current = false;
                Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.False);
            }
            using var unavailable = PreparedFieldTypes.CreateForGeneration(generator, [owner, target], _ => true);
            Assert.That(unavailable, Is.Null);

            current = true;
            using var replaced = PreparedFieldTypes.CreateForGeneration(generator, [owner, target], _ => true);
            Assert.That(replaced!.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);
            source.PreEmissionSourceInputs = null;
            Assert.That(replaced.CanWriteSimpleName(owner, owner.Fields[0]), Is.False);
        }

        [Test]
        public void PreparedAndQualifiedFieldsBindToTheSameTypeWithoutErrors()
        {
            var target = Target();
            var owner = new FieldOwner(target.Type, includeProperty: true);
            var baseline = new TypeProviderWriter(owner).Write().Content;
            var prepared = WriteWithPreparedContext(owner, target);
            var targetCode = new TypeProviderWriter(target).Write().Content;

            var before = CompileField(baseline, targetCode);
            var after = CompileField(prepared, targetCode);

            Assert.That(before, Is.EqualTo("Sample.Widget"));
            Assert.That(after, Is.EqualTo(before));
        }

        [TestCase("enabled", true)]
        [TestCase("unknown", false)]
        [TestCase("default", false)]
        [TestCase("disabled", false)]
        [TestCase("rewriter", false)]
        public async Task GeneratorUsesPreparedFieldContextOnlyForTheEnabledPolicy(string mode, bool expectedUse)
        {
            var directory = Path.Combine(Path.GetTempPath(), "typespec-prepared-generator", Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(directory);
            try
            {
                var options = mode switch
                {
                    "enabled" or "rewriter" or "unknown" => "\"enable-pre-emission-simplification\":true,",
                    "disabled" => "\"enable-pre-emission-simplification\":true,\"disable-roslyn-reduce\":true,",
                    _ => string.Empty
                };
                var json = "{" + options + "\"package-name\":\"Sample\",\"unreferenced-types-handling\":\"keepAll\"}";
                var mock = await MockHelpers.LoadMockGeneratorAsync(outputPath: directory, configuration: json,
                    compilation: () => Task.FromResult<Compilation>(CSharpCompilation.Create("Customization")));
                var target = Target();
                var owner = new FieldOwner(target.Type);
                var generator = new PipelineGenerator(new GeneratorContext(mock.Object.Configuration),
                    mock.Object.InputLibrary, mock.Object.TypeFactory, new TestOutputLibrary(owner, target), provideSnapshot: mode != "unknown");
                if (mode == "rewriter")
                {
                    generator.AddRewriter(new TestRewriter());
                }
                CodeModelGenerator.Instance = generator;

                await new CSharpGen().ExecuteAsync();

                var actual = await File.ReadAllTextAsync(Path.Combine(directory, "Clock.cs"));
                // The controlled host is consulted twice while preparing and again
                // at the actual field occurrence when the writer consumes it.
                Assert.That(generator.SourceChecks >= 4, Is.EqualTo(expectedUse));
                StringAssert.Contains(mode == "disabled" ? "private global::Sample.Widget _value;" : "private Widget _value;", actual);
                Assert.That(CompileField(actual, await File.ReadAllTextAsync(Path.Combine(directory, "Widget.cs"))), Is.EqualTo("Sample.Widget"));
            }
            finally
            {
                Directory.Delete(directory, recursive: true);
            }
        }

        [Test]
        public async Task LaterSerializationMutationCannotInvalidateEarlierFieldBinding()
        {
            var directory = Path.Combine(Path.GetTempPath(), "typespec-prepared-transaction", Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(directory);
            try
            {
                const string json = "{\"enable-pre-emission-simplification\":true,\"package-name\":\"Sample\",\"unreferenced-types-handling\":\"keepAll\"}";
                var mock = await MockHelpers.LoadMockGeneratorAsync(outputPath: directory, configuration: json,
                    compilation: () => Task.FromResult<Compilation>(CSharpCompilation.Create("Customization")));
                var target = Target();
                var owner = new FieldOwner(target.Type, hasSerialization: true, mutateSerializationOnWrite: true);
                var generator = new PipelineGenerator(new GeneratorContext(mock.Object.Configuration),
                    mock.Object.InputLibrary, mock.Object.TypeFactory, new TestOutputLibrary(owner, target));
                CodeModelGenerator.Instance = generator;

                await new CSharpGen().ExecuteAsync();

                var ownerCode = await File.ReadAllTextAsync(Path.Combine(directory, "Clock.cs"));
                var targetCode = await File.ReadAllTextAsync(Path.Combine(directory, "Widget.cs"));
                var serializationCode = await File.ReadAllTextAsync(Path.Combine(directory, "Clock.Serialization.cs"));
                Assert.That(generator.SourceChecks, Is.GreaterThanOrEqualTo(4));
                Assert.That(CompileField(ownerCode, targetCode, serializationCode), Is.EqualTo("Sample.Widget"));
            }
            finally
            {
                Directory.Delete(directory, recursive: true);
            }
        }

        [Test]
        public async Task TransientSerializerShadowCannotChangeAnEarlierFieldBinding()
        {
            var directory = Path.Combine(Path.GetTempPath(), "typespec-transient-transaction", Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(directory);
            try
            {
                const string json = "{\"enable-pre-emission-simplification\":true,\"package-name\":\"Sample\",\"unreferenced-types-handling\":\"keepAll\"}";
                var mock = await MockHelpers.LoadMockGeneratorAsync(outputPath: directory, configuration: json,
                    compilation: () => Task.FromResult<Compilation>(CSharpCompilation.Create("Customization")));
                var target = Target();
                var owner = new TransientOwner(target.Type);
                ((TransientSerialization)owner.SerializationProviders[0]).InitializeRetainedList();
                var generator = new PipelineGenerator(new GeneratorContext(mock.Object.Configuration),
                    mock.Object.InputLibrary, mock.Object.TypeFactory, new TestOutputLibrary(owner, target));
                CodeModelGenerator.Instance = generator;

                await new CSharpGen().ExecuteAsync();

                var ownerCode = await File.ReadAllTextAsync(Path.Combine(directory, "Clock.cs"));
                var targetCode = await File.ReadAllTextAsync(Path.Combine(directory, "Widget.cs"));
                var serializationCode = await File.ReadAllTextAsync(Path.Combine(directory, "Clock.Serialization.cs"));
                Assert.That(generator.SourceChecks, Is.GreaterThanOrEqualTo(4));
                Assert.That(CompileField(ownerCode, targetCode, serializationCode), Is.EqualTo("Sample.Widget"));
            }
            finally
            {
                Directory.Delete(directory, recursive: true);
            }
        }

        [Test]
        public async Task TransientBaseListCannotChangeAnEarlierFieldBinding()
        {
            var directory = Path.Combine(Path.GetTempPath(), "typespec-transient-base", Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(directory);
            try
            {
                const string json = "{\"enable-pre-emission-simplification\":true,\"package-name\":\"Sample\",\"unreferenced-types-handling\":\"keepAll\"}";
                var mock = await MockHelpers.LoadMockGeneratorAsync(outputPath: directory, configuration: json,
                    compilation: () => Task.FromResult<Compilation>(CSharpCompilation.Create("Customization")));
                var target = Target();
                var baseProvider = new BaseWithNestedWidget();
                var bases = new List<CSharpType>();
                var owner = new FieldOwner(target.Type, onTypeAttribute: () => bases.Add(baseProvider.Type), onFieldAttribute: bases.Clear);
                owner.Update(implements: bases);
                var generator = new PipelineGenerator(new GeneratorContext(mock.Object.Configuration),
                    mock.Object.InputLibrary, mock.Object.TypeFactory, new TestOutputLibrary(owner, target, baseProvider));
                CodeModelGenerator.Instance = generator;

                await new CSharpGen().ExecuteAsync();

                var ownerCode = await File.ReadAllTextAsync(Path.Combine(directory, "Clock.cs"));
                var targetCode = await File.ReadAllTextAsync(Path.Combine(directory, "Widget.cs"));
                var baseCode = await File.ReadAllTextAsync(Path.Combine(directory, "Base.cs"));
                Assert.That(generator.SourceChecks, Is.GreaterThanOrEqualTo(4));
                Assert.That(CompileField(ownerCode, targetCode, baseCode), Is.EqualTo("Sample.Widget"));
            }
            finally
            {
                Directory.Delete(directory, recursive: true);
            }
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task RewriterRegisteredDuringWritingReceivesQualifiedFieldWithoutReplayingCallbacks(bool afterFieldType)
        {
            static async Task<(string Content, int Calls, int Matches, int SourceChecks)> Generate(bool enabled, bool afterFieldType)
            {
                var directory = Path.Combine(Path.GetTempPath(), "typespec-late-rewriter", Guid.NewGuid().ToString("N"));
                Directory.CreateDirectory(directory);
                try
                {
                    var option = enabled ? "\"enable-pre-emission-simplification\":true," : string.Empty;
                    var json = "{" + option + "\"package-name\":\"Sample\",\"unreferenced-types-handling\":\"keepAll\"}";
                    var mock = await MockHelpers.LoadMockGeneratorAsync(outputPath: directory, configuration: json,
                        compilation: () => Task.FromResult<Compilation>(CSharpCompilation.Create("Customization")));
                    var target = Target();
                    var rewriter = new QualifiedFieldRewriter();
                    var calls = 0;
                    void RegisterRewriter()
                    {
                        calls++;
                        CodeModelGenerator.Instance.AddRewriter(rewriter);
                    }
                    var owner = afterFieldType
                        ? new FieldOwner(target.Type, onFieldInitializer: RegisterRewriter)
                        : new FieldOwner(target.Type, onFieldAttribute: RegisterRewriter);
                    var generator = new PipelineGenerator(new GeneratorContext(mock.Object.Configuration),
                        mock.Object.InputLibrary, mock.Object.TypeFactory, new TestOutputLibrary(owner, target));
                    CodeModelGenerator.Instance = generator;

                    await new CSharpGen().ExecuteAsync();

                    return (await File.ReadAllTextAsync(Path.Combine(directory, "Clock.cs")), calls, rewriter.Matches, generator.SourceChecks);
                }
                finally
                {
                    Directory.Delete(directory, recursive: true);
                }
            }

            var baseline = await Generate(enabled: false, afterFieldType);
            var candidate = await Generate(enabled: true, afterFieldType);

            Assert.That(baseline.Calls, Is.EqualTo(1));
            Assert.That(baseline.Matches, Is.EqualTo(1));
            StringAssert.Contains(afterFieldType ? "private readonly Widget _value = default;" : "private readonly Widget _value;", baseline.Content);
            Assert.That(candidate.SourceChecks, Is.GreaterThan(0), "The candidate must enter the prepared path.");
            Assert.That(candidate.Calls, Is.EqualTo(1), "Fallback must not replay writer callbacks.");
            Assert.That(candidate.Matches, Is.EqualTo(1), "The late rewriter must receive the qualified spelling.");
            Assert.That(candidate.Content, Is.EqualTo(baseline.Content));
        }

        [TestCase(true)]
        [TestCase(false)]
        public async Task FallbackDoesNotRunWriterCallbacksTwice(bool enabled)
        {
            var directory = Path.Combine(Path.GetTempPath(), "typespec-writer-callback", Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(directory);
            try
            {
                var option = enabled ? "\"enable-pre-emission-simplification\":true," : "\"disable-roslyn-reduce\":true,";
                var json = "{" + option + "\"package-name\":\"Sample\",\"unreferenced-types-handling\":\"keepAll\"}";
                var mock = await MockHelpers.LoadMockGeneratorAsync(outputPath: directory, configuration: json,
                    compilation: () => Task.FromResult<Compilation>(CSharpCompilation.Create("Customization")));
                var target = Target();
                var count = 0;
                var owner = new FieldOwner(target.Type, hasSerialization: true, mutateSerializationOnWrite: true, nextWrite: () => ++count);
                var generator = new PipelineGenerator(new GeneratorContext(mock.Object.Configuration),
                    mock.Object.InputLibrary, mock.Object.TypeFactory, new TestOutputLibrary(owner, target));
                CodeModelGenerator.Instance = generator;

                await new CSharpGen().ExecuteAsync();

                var ownerCode = await File.ReadAllTextAsync(Path.Combine(directory, "Clock.cs"));
                var attribute = CSharpSyntaxTree.ParseText(ownerCode).GetRoot().DescendantNodes().OfType<AttributeSyntax>().Single();
                var message = (LiteralExpressionSyntax)attribute.ArgumentList!.Arguments[0].Expression;
                Assert.That(count, Is.EqualTo(1));
                Assert.That(message.Token.ValueText, Is.EqualTo("1"));
            }
            finally
            {
                Directory.Delete(directory, recursive: true);
            }
        }

        [Test]
        public async Task FinalPipelineMatchesTheExistingReductionAndPocFieldSpelling()
        {
            var directory = Path.Combine(Path.GetTempPath(), "typespec-prepared-field", Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(directory);
            try
            {
                await MockHelpers.LoadMockGeneratorAsync(outputPath: directory,
                    configuration: "{\"package-name\":\"Sample\"}",
                    compilation: () => Task.FromResult<Compilation>(CSharpCompilation.Create("Customization")));
                var target = Target();
                var owner = new FieldOwner(target.Type, includeProperty: true);
                var baselineFile = new TypeProviderWriter(owner).Write();
                using var prepared = PreparedFieldTypes.Create([owner, target], CurrentCompilation, _ => true);
                var preparedFile = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
                var targetFile = new TypeProviderWriter(target).Write();
                StringAssert.Contains("private global::Sample.Widget _value;", baselineFile.Content);
                StringAssert.Contains("private Widget _value;", preparedFile.Content);

                var baseline = await RunWorkspace(baselineFile, targetFile);
                var actual = await RunWorkspace(preparedFile, targetFile);

                Assert.That(actual, Is.EqualTo(baseline));
                StringAssert.Contains("private Widget _value;", actual);
                Assert.That(CompileField(actual, targetFile.Content), Is.EqualTo("Sample.Widget"));
            }
            finally
            {
                Directory.Delete(directory, recursive: true);
            }
        }

        private static async Task<string> RunWorkspace(CodeFile owner, CodeFile target)
        {
            GeneratedCodeWorkspace.Initialize();
            var workspace = await GeneratedCodeWorkspace.Create(isCustomCodeProject: false);
            await workspace.AddGeneratedFile(owner);
            await workspace.AddGeneratedFile(target);
            await foreach (var file in workspace.GetGeneratedFilesAsync())
            {
                if (file.Name == owner.Name)
                {
                    return file.Text;
                }
            }
            throw new InvalidOperationException("The field owner was not emitted.");
        }

        private static string CompileField(string ownerCode, string targetCode, params string[] additionalCode)
        {
            var ownerTree = CSharpSyntaxTree.ParseText(ownerCode);
            var trees = new List<SyntaxTree> { ownerTree, CSharpSyntaxTree.ParseText(targetCode) };
            trees.AddRange(additionalCode.Select(code => CSharpSyntaxTree.ParseText(code)));
            var compilation = CSharpCompilation.Create("BindingTest", trees,
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            var errors = compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
            Assert.That(errors, Is.Empty, string.Join(Environment.NewLine, errors.Select(e => e.ToString())));
            var field = ownerTree.GetRoot().DescendantNodes().OfType<FieldDeclarationSyntax>().Single();
            return compilation.GetSemanticModel(ownerTree).GetTypeInfo(field.Declaration.Type).Type!.ToDisplayString();
        }

        private static string[] DiagnosticSignatures(Compilation compilation) => compilation.GetDiagnostics()
            .Select(d => $"{d.Id}:{d.Severity}:{d.GetMessage()}").OrderBy(d => d, StringComparer.Ordinal).ToArray();

        private static (FieldOwner Owner, TestTypeProvider Target, CSharpCompilation Compilation) GeneratedTargetWithMetadataPrefix(bool rootPrefix)
        {
            var external = CSharpCompilation.Create("MetadataPrefix",
                [CSharpSyntaxTree.ParseText(rootPrefix ? "public class Root { }" : "namespace Root { public class Sub { } }")],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            using var stream = new MemoryStream();
            var emit = external.Emit(stream);
            Assert.That(emit.Success, Is.True, string.Join("\n", emit.Diagnostics));
            var compilation = ReferenceCompilation(MetadataReference.CreateFromImage(stream.ToArray()));
            compilation = compilation.WithOptions(compilation.Options.WithSpecificDiagnosticOptions(
                new Dictionary<string, ReportDiagnostic> { ["CS0435"] = ReportDiagnostic.Error }));
            var target = Target("Root.Sub");
            var owner = new FieldOwner(target.Type);
            owner.Type.Namespace = target.Type.Namespace;
            return (owner, target, compilation);
        }

        private static Compilation CurrentCompilation => CodeModelGenerator.Instance.SourceInputModel.Customization!;

        private static CSharpCompilation CompilationWith(string source) =>
            CSharpCompilation.Create("Customization", [CSharpSyntaxTree.ParseText(source)]);

        private static TestTypeProvider Target(string ns = "Sample") =>
            new(name: "Widget", ns: ns, declarationModifiers: TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class);

        private static PolicyGenerator CreateGenerator(string json, bool complete = true)
        {
            var configuration = Configuration.Load(TestContext.CurrentContext.WorkDirectory, json);
            return new PolicyGenerator(new GeneratorContext(configuration))
            {
                SourceInputModel = complete ? ControlledSourceInput(configuration) : new SourceInputModel(CurrentCompilation, null)
            };
        }

        // The fixture controls the entire in-memory build input set. Production
        // hosts must supply the equivalent complete, revalidated source snapshot.
        private static SourceInputModel ControlledSourceInput(Configuration configuration, Func<bool>? isCurrent = null)
        {
            var compilation = (CSharpCompilation)CurrentCompilation;
            return new SourceInputModel(compilation, null)
            {
                PreEmissionSourceInputs = new CompleteSourceInputSnapshot(configuration.OutputDirectory, "unit-test-epoch",
                    compilation, ["controlled-test-build"], isCurrent ?? (() => true))
            };
        }

        private static string WriteWithPreparedContext(TypeProvider owner, TypeProvider target, Compilation? compilation = null)
        {
            using var prepared = PreparedFieldTypes.Create([owner, target], compilation ?? CurrentCompilation, _ => true);
            var writer = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared };
            return writer.Write().Content;
        }

        private class PolicyGenerator(GeneratorContext context) : CodeModelGenerator(context) { }

        private sealed class PipelineGenerator(GeneratorContext context, InputLibrary inputLibrary, TypeFactory typeFactory,
            OutputLibrary outputLibrary, bool provideSnapshot = true) : CodeModelGenerator(context)
        {
            internal int SourceChecks { get; private set; }
            public override InputLibrary InputLibrary => inputLibrary;
            public override TypeFactory TypeFactory => typeFactory;
            public override OutputLibrary OutputLibrary => outputLibrary;
            public override SourceInputModel SourceInputModel
            {
                get => base.SourceInputModel;
                internal set
                {
                    base.SourceInputModel = value;
                    if (provideSnapshot && value.Customization is CSharpCompilation compilation)
                    {
                        value.PreEmissionSourceInputs = new CompleteSourceInputSnapshot(Configuration.OutputDirectory, "controlled-test-epoch",
                            compilation, ["controlled-test-build"], () => { SourceChecks++; return true; });
                    }
                }
            }
        }

        private sealed class CustomWriterGenerator(GeneratorContext context) : PolicyGenerator(context)
        {
            public override TypeProviderWriter GetWriter(TypeProvider provider) => new(provider);
        }

        private sealed class OverloadedWriterGenerator(GeneratorContext context) : PolicyGenerator(context)
        {
            public void GetWriter<T>(TypeProvider provider) { }
            public void GetWriter<T, U>(TypeProvider provider) { }
        }

        private sealed class FieldOwner(CSharpType fieldType, bool includeProperty = false, bool nestedShadow = false,
            bool inherited = false, bool genericOwner = false, string fieldName = "_value",
            bool hasSerialization = false, bool serializationShadow = false, bool twoSerializations = false,
            bool mutateFieldAttribute = false, bool mutateSerializationOnWrite = false, string? relativePath = null,
            Func<int>? nextWrite = null, bool includeFrameworkField = false,
            Action? onTypeAttribute = null, Action? onFieldAttribute = null, Action? onFieldInitializer = null) : TypeProvider
        {
            protected override IReadOnlyList<MethodBodyStatement> BuildAttributes()
            {
                var attributes = new List<MethodBodyStatement>(base.BuildAttributes());
                if (nextWrite is not null)
                {
                    attributes.Add(new AttributeStatement(typeof(ObsoleteAttribute), new CountingExpression(nextWrite)));
                }
                if (onTypeAttribute is not null)
                {
                    attributes.Add(new AttributeStatement(typeof(ObsoleteAttribute), new MutatingExpression(onTypeAttribute)));
                }
                return attributes;
            }
            protected override string BuildName() => "Clock";
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() => relativePath ?? "Clock.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class;
            protected override CSharpType? BuildBaseType() => inherited
                ? new CSharpType("Base", "Sample", false, false, null, [], false, false) : null;
            protected override CSharpType[] GetTypeArguments() => genericOwner
                ? [new CSharpType(typeof(GenericMarker<>).GetGenericArguments()[0])] : [];
            protected internal override FieldProvider[] BuildFields()
            {
                var fieldAttributes = new List<AttributeStatement>();
                if (mutateFieldAttribute)
                {
                    fieldAttributes.Add(new AttributeStatement(typeof(ObsoleteAttribute),
                        new MutatingExpression(() => Update(nestedTypes: [new Shadow(this)]))));
                }
                if (onFieldAttribute is not null)
                {
                    fieldAttributes.Add(new AttributeStatement(typeof(ObsoleteAttribute), new MutatingExpression(onFieldAttribute)));
                }
                var field = new FieldProvider(FieldModifiers.Private, fieldType, fieldName, this,
                    initializationValue: onFieldInitializer is null ? null : new InitializerCallback(onFieldInitializer), attributes: fieldAttributes);
                return includeFrameworkField
                    ? [field, new FieldProvider(FieldModifiers.Private, typeof(DateTimeOffset), "_timestamp", this)]
                    : [field];
            }
            protected internal override PropertyProvider[] BuildProperties() => includeProperty
                ? [new PropertyProvider(null, MethodSignatureModifiers.Private, fieldType, "Other", new AutoPropertyBody(true), this)] : [];
            protected override TypeProvider[] BuildNestedTypes() => nestedShadow ? [new Shadow(this)] : [];
            protected override TypeProvider[] BuildSerializationProviders() => hasSerialization
                ? twoSerializations
                    ? [new PartialSerialization(this, fieldType, serializationShadow), new PartialSerialization(this, fieldType, false, "2")]
                    : [new PartialSerialization(this, fieldType, serializationShadow, mutateOnWrite: mutateSerializationOnWrite)]
                : [];
        }

        private sealed class KnownPartial : TypeProvider
        {
            private readonly TypeProvider _owner;
            private readonly CSharpType _fieldType;
            private readonly bool _shadow;
            private readonly string _suffix;
            public KnownPartial(TypeProvider owner, CSharpType fieldType, bool shadow = false, bool register = true, string suffix = "")
            {
                _owner = owner;
                _fieldType = fieldType;
                _shadow = shadow;
                _suffix = suffix;
                if (register)
                {
                    RegisterPartialDeclarationOwner(owner);
                }
            }
            protected override string BuildName() => _owner.Name;
            protected override string BuildNamespace() => _owner.Type.Namespace;
            protected override string BuildRelativeFilePath() => "Clock.Rest" + _suffix + ".cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class;
            protected internal override FieldProvider[] BuildFields() => [new FieldProvider(FieldModifiers.Private, _fieldType, "_restValue" + _suffix, this)];
            protected override TypeProvider[] BuildNestedTypes() => _shadow ? [new Shadow(this)] : [];
        }

        private sealed class SerializableWidget : TypeProvider
        {
            protected override string BuildName() => "Widget";
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() => "Widget.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class;
            protected override TypeProvider[] BuildSerializationProviders() => [new PartialSerialization(this, null, false)];
        }

        private sealed class PartialSerialization(TypeProvider owner, CSharpType? fieldType, bool nestedShadow,
            string suffix = "", bool mutateOnWrite = false) : TypeProvider
        {
            private bool _mutated;
            private void MutateOnce()
            {
                if (!_mutated)
                {
                    _mutated = true;
                    Update(nestedTypes: [new Shadow(this)]);
                }
            }
            protected override string BuildName() => owner.Type.Name;
            protected override string BuildNamespace() => owner.Type.Namespace;
            protected override string BuildRelativeFilePath() => owner.Type.Name + ".Serialization" + suffix + ".cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class;
            protected internal override FieldProvider[] BuildFields() => fieldType is null ? [] :
                [new FieldProvider(FieldModifiers.Private, fieldType, "_serializedValue" + suffix, this,
                    attributes: mutateOnWrite ? [new AttributeStatement(typeof(ObsoleteAttribute), new MutatingExpression(MutateOnce))] : [])];
            protected override TypeProvider[] BuildNestedTypes() => nestedShadow ? [new Shadow(this)] : [];
        }

        private sealed class BaseWithNestedWidget : TypeProvider
        {
            protected override string BuildName() => "Base";
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() => "Base.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class;
            protected override TypeProvider[] BuildNestedTypes() => [new PublicShadow(this)];
        }

        private sealed class PublicShadow(TypeProvider declaringType) : TypeProvider
        {
            protected override string BuildName() => "Widget";
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() => "Base.cs";
            protected override TypeProvider? BuildDeclaringTypeProvider() => declaringType;
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Class;
        }

        private sealed class TransientOwner(CSharpType fieldType) : TypeProvider
        {
            protected override string BuildName() => "Clock";
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() => "Clock.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class;
            protected internal override FieldProvider[] BuildFields() => [new FieldProvider(FieldModifiers.Private, fieldType, "_value", this)];
            protected override TypeProvider[] BuildSerializationProviders() => [new TransientSerialization(this, fieldType)];
        }

        private sealed class TransientSerialization(TypeProvider owner, CSharpType fieldType) : TypeProvider
        {
            private readonly List<TypeProvider> _nested = [];
            internal void InitializeRetainedList() => Update(nestedTypes: _nested);
            protected override string BuildName() => owner.Type.Name;
            protected override string BuildNamespace() => owner.Type.Namespace;
            protected override string BuildRelativeFilePath() => "Clock.Serialization.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class;
            protected internal override FieldProvider[] BuildFields() =>
                [new FieldProvider(FieldModifiers.Private, fieldType, "_serializedValue", this,
                    attributes: [new AttributeStatement(typeof(ObsoleteAttribute),
                        new MutatingExpression(() => _nested.Add(new ClearingShadow(this, () => _nested.Clear()))))])];
        }

        private sealed class ClearingShadow(TypeProvider declaringType, Action clear) : TypeProvider
        {
            protected override string BuildName() => "Widget";
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() => "Clock.Serialization.cs";
            protected override TypeProvider? BuildDeclaringTypeProvider() => declaringType;
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Private | TypeSignatureModifiers.Class;
            protected override IReadOnlyList<MethodBodyStatement> BuildAttributes() =>
                [new AttributeStatement(typeof(ObsoleteAttribute), new MutatingExpression(clear))];
        }

        private sealed class QualifiedFieldRewriter : LibraryRewriter
        {
            public int Matches { get; private set; }

            public override SyntaxNode? VisitFieldDeclaration(FieldDeclarationSyntax node)
            {
                if (node.Declaration.Type.ToString() == "global::Sample.Widget")
                {
                    Matches++;
                    return node.AddModifiers(SyntaxFactory.Token(SyntaxKind.ReadOnlyKeyword));
                }
                return base.VisitFieldDeclaration(node);
            }
        }

        private sealed record InitializerCallback(Action Callback) : ValueExpression
        {
            internal override void WriteCore(CodeWriter writer)
            {
                Callback();
                writer.AppendRaw("default");
            }
        }

        private sealed record CountingExpression(Func<int> Next) : ValueExpression
        {
            internal override void WriteCore(CodeWriter writer) => writer.AppendRaw("\"" + Next() + "\"");
        }

        private sealed record MutatingExpression(Action Mutate) : ValueExpression
        {
            internal override void WriteCore(CodeWriter writer)
            {
                Mutate();
                writer.AppendRaw("\"reason\"");
            }
        }

        private sealed class AttributeOwner(CSharpType fieldType) : CustomCodeAttributeDefinition
        {
            protected override string BuildName() => "Clock";
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() => "Clock.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class;
            protected internal override FieldProvider[] BuildFields() => [new FieldProvider(FieldModifiers.Private, fieldType, "_value", this)];
        }

        private sealed class GenericMarker<T> { }

        private sealed class ClockPathCollision(string relativePath = "Clock.cs") : TypeProvider
        {
            protected override string BuildName() => "Unrelated";
            protected override string BuildNamespace() => "Other";
            protected override string BuildRelativeFilePath() => relativePath;
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class;
        }

        private sealed class StandaloneClockWithShadow : TypeProvider
        {
            protected override string BuildName() => "Clock";
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() => "OtherClock.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() =>
                TypeSignatureModifiers.Internal | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Class;
            protected override TypeProvider[] BuildNestedTypes() => [new Shadow(this)];
        }

        private sealed class UnexpectedStandalonePartial : TypeProvider
        {
            private readonly TypeProvider _declaring = new TestTypeProvider(name: "Outer", ns: "Sample");
            protected override string BuildName() => "Clock";
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() => "OtherClock.cs";
            protected override TypeProvider? BuildDeclaringTypeProvider() => _declaring;
            protected override TypeSignatureModifiers BuildDeclarationModifiers() =>
                TypeSignatureModifiers.Internal | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Class;
            protected override TypeProvider[] BuildNestedTypes() => [new Shadow(this)];
        }

        private sealed class Shadow(TypeProvider declaringType) : TypeProvider
        {
            protected override string BuildName() => "Widget";
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() => "Clock.cs";
            protected override TypeProvider? BuildDeclaringTypeProvider() => declaringType;
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Private | TypeSignatureModifiers.Class;
        }
    }
}
