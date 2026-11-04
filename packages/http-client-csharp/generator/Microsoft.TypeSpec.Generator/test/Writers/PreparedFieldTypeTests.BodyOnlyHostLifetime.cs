// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Security.Cryptography;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.TypeSpec.Generator.Tests.TestHelpers;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.SourceInput.CompilerBuildInputProof;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        // Physical-input and policy guards shared by the original host outcomes.
        [TestCase(false, false)]
        [TestCase(true, true)]
        public void BodyOnlyHostRejectsDisabledPolicyOrCustomWriter(bool enabled, bool customWriter)
        {
            using var host = new BodyOnlyPhysicalHost(enabled, customWriter);
            var (owner, _, _) = CreateBodyOnlyHostOwner();
            Assert.That(host.Snapshot.IsCurrentFor(host.DirectoryPath), Is.True);
            Assert.That(PreparedFieldTypes.IsPolicyEnabled(host.Generator), Is.False);
            using var prepared = PreparedFieldTypes.CreateForGeneration(host.Generator, new TypeProvider[] { owner }, _ => true);
            Assert.That(prepared, Is.Null);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void BodyOnlyHostRejectsMissingOrPhysicallyStaleInputProof(bool stalePhysicalInput)
        {
            using var host = new BodyOnlyPhysicalHost();
            var (owner, _, _) = CreateBodyOnlyHostOwner();
            // Existing CreateGenerator(complete: false) procedure: retain valid
            // Customization, omit PreEmissionSourceInputs.
            host.Generator.SourceInputModel = new SourceInputModel(host.Snapshot.Compilation, null);
            if (stalePhysicalInput)
            {
                // Existing physical stale-hash procedure, no CanComplete flag or
                // direct untrusted CompleteSourceInputSnapshot construction.
                File.AppendAllText(host.SourcePath, "\n// Changed physical compiler input.\n");
                host.Generator.SourceInputModel.PreEmissionSourceInputs = CompilerBuildInputProof.TryCreate(host.Session, host.DirectoryPath);
                Assert.That(host.Generator.SourceInputModel.PreEmissionSourceInputs, Is.Null);
            }
            Assert.That(host.Generator.SourceInputModel.Customization, Is.Not.Null);
            Assert.That(PreparedFieldTypes.IsPolicyEnabled(host.Generator), Is.True);
            using var prepared = PreparedFieldTypes.CreateForGeneration(host.Generator, new TypeProvider[] { owner }, _ => true);
            Assert.That(prepared, Is.Null);
        }

        [Test]
        public void BodyOnlyHostPhysicalInputChangeSelectsSamePassQualifiedFallback()
        {
            using var host = new BodyOnlyPhysicalHost(customizationSource: OriginalTypeOfSupportSource(captured: false));
            var owner = new OriginalTypeOfHostOwner(captured: false);
            owner.EnsureBuilt();
            FinalizeGeneratedInstanceOwner(owner);
            using var prepared = PreparedFieldTypes.CreateForGeneration(host.Generator, new TypeProvider[] { owner }, _ => true);
            Assert.That(prepared, Is.Not.Null);
            var writer = host.Generator.GetWriter(owner);
            writer.PreparedFieldTypes = prepared;
            var output = writer.Write(); // ONE pass, before mutation.
            var savedQualifiedContent = output.QualifiedContent
                ?? throw new InvalidOperationException("Missing same-pass qualified companion.");
            var raw = AssertOriginalTypeOfNative(output.Content, host.Snapshot, captured: false);
            var qualified = AssertOriginalTypeOfNative(savedQualifiedContent, host.Snapshot, captured: false);
            Assert.That(raw.SeedType, Is.EqualTo("Exception"));
            Assert.That(raw.OperandType, Is.EqualTo("Exception"));
            Assert.That(host.Snapshot.IsCurrentFor(host.DirectoryPath), Is.True);
            Assert.That(prepared!.CanCommit(), Is.True);
            Assert.That(prepared.CanCommitBodyNames(output), Is.True);

            File.AppendAllText(host.SourcePath, "\n// Changed after the original writer pass.\n");

            Assert.That(host.Snapshot.IsCurrentFor(host.DirectoryPath), Is.False);
            Assert.That(prepared.CanCommit(), Is.False);
            Assert.That(prepared.CanCommitBodyNames(output), Is.False);
            // Actual channel-selection API, on the original staged file; no
            // workspace, callback replay or another preparation/writer pass.
            var shared = prepared.CanCommitSharedSnapshot() && PreparedFieldTypes.IsPolicyEnabled(host.Generator);
            var selected = output.SelectPreparedNames(shared && prepared.CanCommit(), shared && prepared.CanCommitBodyNames(output));
            Assert.That(selected.Content, Is.EqualTo(savedQualifiedContent));
            Assert.That(qualified.SeedType, Is.EqualTo("global::System.Exception"));
            Assert.That(qualified.OperandType, Is.EqualTo("global::System.Exception"));
        }

        private static (TypeProvider Owner, TypeOfExpression Operand, InvokeMethodExpression Call) CreateBodyOnlyHostOwner()
        {
            var operand = new TypeOfExpression(typeof(Exception));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(typeof(PreparedRawTypeOfPermissionProbe)),
                "SafeType", new ValueExpression[] { operand });
            var owner = new ParameterValueOwner(call, Array.Empty<ParameterProvider>(), name: "RawTypeOfPermissionOwner", emptyDocs: true);
            owner.EnsureBuilt();
            FinalizeGeneratedInstanceOwner(owner); // pure cached docs/header/warnings/path; no service replacement.
            Assert.That(owner.Fields, Is.Empty);
            Assert.That(owner.Constructors, Is.Empty);
            Assert.That(owner.Properties, Is.Empty);
            Assert.That(owner.NestedTypes, Is.Empty);
            Assert.That(owner.SerializationProviders, Is.Empty);
            Assert.That(owner.BaseType, Is.Null);
            Assert.That(owner.Implements, Is.Empty);
            Assert.That(owner.CustomCodeView, Is.Null);
            Assert.That(owner.Methods, Has.Count.EqualTo(1));
            Assert.That(owner.Methods.Single().Signature.Parameters, Is.Empty);
            Assert.That(CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap.ContainsKey(owner.Type), Is.False);
            return (owner, operand, call);
        }

        private static FieldInfo BodyOnlyExistingSlot(Type type, string name) =>
            type.GetField(name, BindingFlags.NonPublic | BindingFlags.Instance)
                ?? throw new InvalidOperationException("Existing lifetime slot not found: " + name);

        // Mirrors CompilerBuildInputProofTests' physical hashed fixture session.
        // COMPLETE controlled unit inventory, NOT a directory scan, MSBuild
        // consumer proof, or a completeness claim about an SDK. Native oracle
        // inputs (including all physical references) come from TryCreate.
        private sealed class BodyOnlyPhysicalHost : IDisposable
        {
            private readonly CodeModelGenerator _previous = CodeModelGenerator.Instance;
            internal string DirectoryPath { get; } = Path.Combine(Path.GetTempPath(), "typespec-body-only-host-" + Guid.NewGuid().ToString("N"));
            internal string SourcePath { get; }
            internal BodyOnlyFixedSession Session { get; }
            internal CompleteSourceInputSnapshot Snapshot { get; }
            internal CodeModelGenerator Generator { get; }

            internal BodyOnlyPhysicalHost(bool enabled = true, bool customWriter = false, string? customizationSource = null)
            {
                Directory.CreateDirectory(DirectoryPath);
                SourcePath = Path.Combine(DirectoryPath, "Customization.cs");
                // Default callers retain the original empty customization input.
                // Optional complete support source is written BEFORE its physical
                // identity/hash and compiler-input proof are captured.
                File.WriteAllText(SourcePath, customizationSource ?? "// No customization declarations.\n");
                var sourceInputs = CallProofCompilation(); // TPA can repeat a physical reference.
                Assert.That(sourceInputs.SyntaxTrees, Is.Empty);
                var groups = sourceInputs.References.GroupBy(reference =>
                    ((PortableExecutableReference)reference).FilePath, StringComparer.Ordinal).ToArray();
                // A controlled compiler inventory must not contain ignored duplicate
                // references. Collapse only identical physical entries, retaining
                // every distinct path and requiring identical compiler properties.
                foreach (var group in groups)
                {
                    Assert.That(group.All(reference => reference.Properties.Equals(group.First().Properties)), Is.True);
                    if (group.Count() > 1) { TestContext.WriteLine("Duplicate controlled reference: " + group.Key + " x" + group.Count()); }
                }
                var inputs = sourceInputs.RemoveAllReferences().AddReferences(groups.Select(group => group.First()));
                var references = inputs.References.Select(reference =>
                {
                    var physical = reference as PortableExecutableReference;
                    var path = physical?.FilePath
                        ?? throw new InvalidOperationException("Every controlled reference must be physical.");
                    return new CapturedCompilerReference(path, BodyOnlyInputHash(path), reference.Properties.Aliases.ToArray(), reference.Properties.EmbedInteropTypes);
                }).ToArray();
                var unusablePaths = references.Where(r => !CompilerBuildInputProof.IsUsablePath(r.Path)).Select(r => r.Path).ToArray();
                Assert.That(unusablePaths, Is.Empty, "Physical reference paths rejected by the existing proof policy.");
                var unresolvedReferences = inputs.References.Where(r => inputs.GetAssemblyOrModuleSymbol(r) is null).Select(r => r.Display).ToArray();
                Assert.That(unresolvedReferences, Is.Empty, "The controlled compiler reference inventory must bind every captured reference.");
                Session = new BodyOnlyFixedSession(new CompilerBuildInputCapture(
                    DirectoryPath, Guid.NewGuid().ToString("N"), "controlled-body-only-unit-fixture", "12.0", "BodyOnlyHostInputs",
                    Array.Empty<string>(), [new CapturedCompilerSource(SourcePath, BodyOnlyInputHash(SourcePath))], references,
                    false, false, new CSharpParseOptions(LanguageVersion.CSharp12), inputs.Options));
                Snapshot = CompilerBuildInputProof.TryCreate(Session, DirectoryPath)
                    ?? throw new InvalidOperationException("Physical capture rejected; do not bypass the proof gate.");
                var configuration = Configuration.Load(DirectoryPath,
                    enabled ? "{\"enable-pre-emission-simplification\":true,\"disable-roslyn-reduce\":false}"
                            : "{\"disable-roslyn-reduce\":false}");
                Generator = customWriter
                    ? new BodyOnlyCustomWriterGenerator(new GeneratorContext(configuration))
                    : new BodyOnlyHostGenerator(new GeneratorContext(configuration));
                Generator.SourceInputModel = new SourceInputModel(Snapshot.Compilation, null) { PreEmissionSourceInputs = Snapshot };
                Assert.That(Generator.Configuration.DisableRoslynReduce, Is.False);
                Assert.That(Generator.Rewriters, Is.Empty);
                // Audit REAL inherited factory getter; never override to count.
                Assert.That(Generator.GetType().GetProperty(nameof(CodeModelGenerator.TypeFactory))!.GetMethod!.DeclaringType,
                    Is.EqualTo(typeof(CodeModelGenerator)));
                if (!customWriter)
                {
                    Assert.That(Generator.GetType().GetMethod(nameof(CodeModelGenerator.GetWriter), new[] { typeof(TypeProvider) })!.DeclaringType,
                        Is.EqualTo(typeof(CodeModelGenerator)));
                }
                CodeModelGenerator.Instance = Generator;
            }

            public void Dispose()
            {
                CodeModelGenerator.Instance = _previous;
                File.Delete(SourcePath);
                Directory.Delete(DirectoryPath); // exactly one physical source; no recursive cleanup.
            }
        }

        private static string BodyOnlyInputHash(string path) => Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(path)));
        private sealed class BodyOnlyFixedSession(CompilerBuildInputCapture capture) : ITrustedCompilerBuildSession
        {
            public CompilerBuildInputCapture Capture => capture;
            public bool IsCurrent() => true; // immutable controlled session; TryCreate owns actual byte/hash revalidation.
        }
        private class BodyOnlyHostGenerator(GeneratorContext context) : CodeModelGenerator(context) { }
        private sealed class BodyOnlyCustomWriterGenerator(GeneratorContext context) : BodyOnlyHostGenerator(context)
        {
            public override TypeProviderWriter GetWriter(TypeProvider provider) => base.GetWriter(provider);
        }
    }
}
