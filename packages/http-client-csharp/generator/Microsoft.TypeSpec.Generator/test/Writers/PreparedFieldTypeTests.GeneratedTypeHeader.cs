// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Reflection;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [Test]
        public void GeneratedTypeHeaderUsesOnlyFinalizedCachesAndInvalidatesStickily()
        {
            var owner = new GeneratedHeaderOwner();
            WarmGeneratedHeader(owner);
            var calls = owner.Callbacks;
            var header = CaptureGeneratedTypeHeader(owner);
            Assert.That(header, Is.Not.Null);
            Assert.That(GraphMember(header!, "IsCurrent"), Is.True);
            Assert.That(owner.Callbacks, Is.EqualTo(calls));
            owner.Update(relativeFilePath: "changed.cs");
            Assert.That(GraphMember(header!, "IsCurrent"), Is.False);
            owner.Update(relativeFilePath: "HeaderProof.cs");
            Assert.That(GraphMember(header!, "IsCurrent"), Is.False);
        }

        [Test]
        public void GeneratedTypeHeaderDoesNotMaterializeMissingDocumentationOrAttributes()
        {
            var owner = new GeneratedHeaderOwner();
            owner.EnsureBuilt();
            _ = owner.Type;
            owner.Update(relativeFilePath: "HeaderProof.cs");
            var calls = owner.Callbacks;
            Assert.That(CaptureGeneratedTypeHeader(owner), Is.Null);
            Assert.That(owner.Callbacks, Is.EqualTo(calls));
        }

        [Test]
        public void GeneratedTypeHeaderObservedPathIsNotPinnedPathEvidence()
        {
            var owner = new GeneratedHeaderOwner();
            WarmGeneratedHeader(owner, pinPath: false);
            _ = owner.RelativeFilePath;
            var calls = owner.Callbacks;
            Assert.That(CaptureGeneratedTypeHeader(owner), Is.Null);
            Assert.That(owner.Callbacks, Is.EqualTo(calls));
        }

        [Test]
        public void GeneratedTypeHeaderNullableConstraintBuilderIsNotReplayed()
        {
            var owner = new GeneratedHeaderDynamicConstraintOwner();
            WarmGeneratedHeader(owner);
            _ = owner.WhereClause;
            var calls = owner.Callbacks;
            Assert.That(CaptureGeneratedTypeHeader(owner), Is.Null);
            Assert.That(owner.Callbacks, Is.EqualTo(calls));
        }

        [Test]
        public void GeneratedTypeHeaderAttributeWritePolicyIsNotInvokedDuringCapture()
        {
            var owner = new GeneratedHeaderDynamicAttributeOwner();
            WarmGeneratedHeader(owner);
            var calls = owner.Callbacks;
            Assert.That(CaptureGeneratedTypeHeader(owner), Is.Null);
            Assert.That(owner.Callbacks, Is.EqualTo(calls));
        }

        [Test]
        public void GeneratedTypeHeaderOpaqueDocumentationWriterRemainsUnknownWithoutExecution()
        {
            var owner = new GeneratedHeaderOpaqueDocumentationOwner();
            WarmGeneratedHeader(owner);
            var calls = owner.Callbacks;
            Assert.That(CaptureGeneratedTypeHeader(owner), Is.Null);
            Assert.That(owner.Callbacks, Is.EqualTo(calls));
        }

        private static void WarmGeneratedHeader(GeneratedHeaderOwner owner, bool pinPath = true)
        {
            owner.EnsureBuilt();
            _ = owner.Type;
            _ = owner.XmlDocs;
            _ = owner.GetAttributesForWrite();
            _ = owner.DisabledFileWarnings;
            if (pinPath) { owner.Update(relativeFilePath: "HeaderProof.cs"); }
        }

        private static object? CaptureGeneratedTypeHeader(TypeProvider owner)
        {
            var type = typeof(TypeProvider).Assembly.GetType("Microsoft.TypeSpec.Generator.Primitives.PreparedGeneratedTypeHeader");
            Assert.That(type, Is.Not.Null);
            var capture = type!.GetMethod("TryCapture", BindingFlags.NonPublic | BindingFlags.Static);
            Assert.That(capture, Is.Not.Null);
            return capture!.Invoke(null, new object[] { owner });
        }

        private class GeneratedHeaderOwner : TypeProvider
        {
            internal int Callbacks { get; set; }
            protected override string BuildName() => "HeaderProof";
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() { Callbacks++; return "HeaderProof.cs"; }
            protected override XmlDocProvider BuildXmlDocs() { Callbacks++; return new XmlDocProvider(); }
            protected override IReadOnlyList<MethodBodyStatement> BuildAttributes() { Callbacks++; return []; }
        }

        private sealed class GeneratedHeaderDynamicConstraintOwner : GeneratedHeaderOwner
        {
            protected override WhereExpression? BuildWhereClause() { Callbacks++; return null; }
        }

        private sealed class GeneratedHeaderDynamicAttributeOwner : GeneratedHeaderOwner
        {
            protected internal override bool ShouldAnalyzeAttributesInReferenceMap { get { Callbacks++; return false; } }
        }

        private sealed class GeneratedHeaderOpaqueDocumentationOwner : GeneratedHeaderOwner
        {
            protected override XmlDocProvider BuildXmlDocs() => new(summary: new XmlDocSummaryStatement([], new GeneratedCustomDoc(() => Callbacks++)));
        }
    }
}
