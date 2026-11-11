// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Reflection;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public void OriginalConstructionDeclarationRetainsOutsideEmptyArgumentProfile(bool initializer)
        {
            using var host = new BodyOnlyPhysicalHost(customizationSource: OriginalTypeOfSupportSource(false));
            var arguments = new List<ValueExpression>();
            if (!initializer) { arguments.Add(Literal("message")); }
            var init = initializer ? new ObjectInitializerExpression(new Dictionary<ValueExpression, ValueExpression>()) : null;
            var owner = CreateOriginalConstructionDeclarationOwner(arguments, init);
            using var prepared = PreparedFieldTypes.CreateForGeneration(host.Generator, new TypeProvider[] { owner }, _ => true);
            Assert.That(prepared, Is.Not.Null);
            var writer = host.Generator.GetWriter(owner);
            writer.PreparedFieldTypes = prepared;
            var output = writer.Write();
            var raw = AssertOriginalConstructionDeclarationNative(output.Content, host.Snapshot, initializer ? 0 : 1, initializer);
            var qualified = AssertOriginalConstructionDeclarationNative(output.QualifiedContent!, host.Snapshot, initializer ? 0 : 1, initializer);
            Assert.That(raw.Diagnostics, Is.EqualTo(qualified.Diagnostics));
            Assert.That(raw.EmitDiagnostics, Is.EqualTo(qualified.EmitDiagnostics));
            Assert.That(output.PreparedBodyNameCount, Is.Zero);
            Assert.That(raw.Seed, Is.EqualTo("global::System.Exception"));
        }

        [Test]
        public void OriginalConstructionDeclarationArgumentMutationStaysInvalidAfterRestoration()
        {
            using var host = new BodyOnlyPhysicalHost(customizationSource: OriginalTypeOfSupportSource(false));
            var arguments = new List<ValueExpression>();
            var owner = CreateOriginalConstructionDeclarationOwner(arguments, null);
            using var prepared = PreparedFieldTypes.CreateForGeneration(host.Generator, new TypeProvider[] { owner }, _ => true);
            Assert.That(prepared, Is.Not.Null);
            var writer = host.Generator.GetWriter(owner);
            writer.PreparedFieldTypes = prepared;
            var output = writer.Write(); // Capture alternatives once, before mutation.
            var raw = AssertOriginalConstructionDeclarationNative(output.Content, host.Snapshot);
            Assert.That(raw.Seed, Is.EqualTo("Exception"));
            Assert.That(output.PreparedBodyNameCount, Is.EqualTo(1));
            Assert.That(prepared!.CanCommitBodyNames(output), Is.True);
            arguments.Add(Literal("changed"));
            Assert.That(prepared.CanCommitBodyNames(output), Is.False, "Observe the affecting returned-argument mutation.");
            arguments.Clear();
            Assert.That(prepared.CanCommitBodyNames(output), Is.False, "Restoring the same owned list must not restore an observed stale permission.");
            var fallback = output.SelectPreparedNames(prepared.CanCommit(), bodyAllowed: false);
            Assert.That(fallback.Content, Is.EqualTo(output.QualifiedContent));
            var retained = AssertOriginalConstructionDeclarationNative(fallback.Content, host.Snapshot);
            Assert.That(retained.Seed, Is.EqualTo("global::System.Exception"));
            Assert.That(retained.Diagnostics, Is.EqualTo(raw.Diagnostics));
            Assert.That(retained.EmitDiagnostics, Is.EqualTo(raw.EmitDiagnostics));
        }

        [TestCase("custom-type")]
        [TestCase("signature-intent")]
        [TestCase("provider-intent")]
        public void OriginalConstructionDeclarationDoesNotBorrowCustomTypesOrConstructorIntents(string mode)
        {
            using var host = new BodyOnlyPhysicalHost(customizationSource: OriginalTypeOfSupportSource(false));
            var owner = new OriginalTypeOfHostOwner(false);
            owner.EnsureBuilt();
            CSharpType type = mode == "custom-type" ? new CSharpType(new OriginalConstructionReflectionType()) : owner.ExceptionType;
            var creation = new NewInstanceExpression(type, Array.Empty<ValueExpression>());
            var signature = new ConstructorSignature(owner.ExceptionType, null, MethodSignatureModifiers.Public, Array.Empty<ParameterProvider>());
            if (mode == "signature-intent") { creation = creation with { ConstructorIntent = signature }; }
            if (mode == "provider-intent")
            {
                creation = creation with { ConstructorProviderIntent = new ConstructorProvider(signature,
                    new MethodBodyStatements(Array.Empty<MethodBodyStatement>()), owner) };
            }
            var call = new InvokeMethodExpression(null, "Pass", new ValueExpression[] { creation });
            owner.M.Update(bodyStatements: new MethodBodyStatements(new MethodBodyStatement[]
                { owner.Seed.Assign(new KeywordExpression("default", null)).Terminate(), Return(call) }));
            FinalizeGeneratedInstanceOwner(owner);
            using var prepared = PreparedFieldTypes.CreateForGeneration(host.Generator, new TypeProvider[] { owner }, _ => true);
            Assert.That(prepared, Is.Not.Null);
            var writer = host.Generator.GetWriter(owner);
            writer.PreparedFieldTypes = prepared;
            var output = writer.Write();
            var raw = AssertOriginalConstructionDeclarationNative(output.Content, host.Snapshot);
            var qualified = AssertOriginalConstructionDeclarationNative(output.QualifiedContent!, host.Snapshot);
            Assert.That(raw.Diagnostics, Is.EqualTo(qualified.Diagnostics));
            Assert.That(raw.EmitDiagnostics, Is.EqualTo(qualified.EmitDiagnostics));
            Assert.That(output.PreparedBodyNameCount, Is.Zero);
            Assert.That(raw.Seed, Is.EqualTo("global::System.Exception"));
        }

        private sealed class OriginalConstructionReflectionType() : TypeDelegator(typeof(Exception)) { }

        private static OriginalTypeOfHostOwner CreateOriginalConstructionDeclarationOwner(
            IReadOnlyList<ValueExpression> arguments, ObjectInitializerExpression? initializer)
        {
            var owner = new OriginalTypeOfHostOwner(false);
            owner.EnsureBuilt();
            var call = new InvokeMethodExpression(null, "Pass", new ValueExpression[]
                { new NewInstanceExpression(owner.ExceptionType, arguments, initializer) });
            owner.M.Update(bodyStatements: new MethodBodyStatements(new MethodBodyStatement[]
                { owner.Seed.Assign(new KeywordExpression("default", null)).Terminate(), Return(call) }));
            FinalizeGeneratedInstanceOwner(owner);
            return owner;
        }
    }
}
