// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Globalization;
using System.Linq;
using System.Reflection;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using System.Runtime.CompilerServices;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [Test]
        public void GeneratedDocumentationEnvelopeAcceptsActualDefaultMethodDocumentation()
        {
            var owner = new GeneratedCallableOwner("observe");
            owner.EnsureBuilt();
            var envelope = CaptureGeneratedDocumentation(owner.Methods[0].XmlDocs);
            Assert.That(envelope, Is.Not.Null);
            Assert.That(GraphMember(envelope!, "IsCurrent"), Is.True);
        }

        [Test]
        public void GeneratedDocumentationEnvelopeCustomInnerWriterIsNotExecuted()
        {
            var callbacks = 0;
            var inner = new GeneratedCustomDoc(() => callbacks++);
            var docs = new XmlDocProvider(summary: new XmlDocSummaryStatement(new FormattableString[] { $"summary" }, inner));
            Assert.That(CaptureGeneratedDocumentation(docs), Is.Null);
            Assert.That(callbacks, Is.Zero);
        }

        [Test]
        public void GeneratedDocumentationEnvelopeCustomFormatterGettersAreNotExecuted()
        {
            var inner = new XmlDocStatement($"<item>", $"</item>", Array.Empty<FormattableString>()) { StartTag = new GeneratedUnknownFormatter() };
            var docs = new XmlDocProvider(summary: new XmlDocSummaryStatement(Array.Empty<FormattableString>(), inner));
            Assert.That(CaptureGeneratedDocumentation(docs), Is.Null);
        }

        [Test]
        public void GeneratedDocumentationEnvelopeLineBreakingTagArgumentIsUnknown()
        {
            var inner = new XmlDocStatement($"<item>", $"</item>", Array.Empty<FormattableString>())
            { StartTag = FormattableStringFactory.Create("<item name=\"{0}\">", new object[] { "name\npublic class Escaped {}" }) };
            var docs = new XmlDocProvider(summary: new XmlDocSummaryStatement(Array.Empty<FormattableString>(), inner));
            Assert.That(CaptureGeneratedDocumentation(docs), Is.Null);
        }

        [Test]
        public void GeneratedDocumentationEnvelopeRetainedArgumentsInvalidateStickily()
        {
            var arguments = new object[] { "name" };
            var inner = new XmlDocStatement($"<item>", $"</item>", Array.Empty<FormattableString>())
            { StartTag = FormattableStringFactory.Create("<item name=\"{0}\">", arguments) };
            var docs = new XmlDocProvider(summary: new XmlDocSummaryStatement(Array.Empty<FormattableString>(), inner));
            var envelope = CaptureGeneratedDocumentation(docs);
            Assert.That(envelope, Is.Not.Null);
            Assert.That(GraphMember(envelope!, "IsCurrent"), Is.True);
            arguments[0] = "changed";
            Assert.That(GraphMember(envelope!, "IsCurrent"), Is.False);
            arguments[0] = "name";
            Assert.That(GraphMember(envelope!, "IsCurrent"), Is.False);
        }

        [Test]
        public void GeneratedDocumentationEnvelopeRejectsExceptionReasonSurfaceInitially()
        {
            var docs = new XmlDocProvider(exceptions: new[]
            { new XmlDocExceptionStatement(typeof(Exception), "reason\npublic class Escaped {}", Array.Empty<ParameterProvider>()) });
            Assert.That(CaptureGeneratedDocumentation(docs), Is.Null);
        }

        [TestCase("negative")]
        [TestCase("nan")]
        [TestCase("infinity")]
        [TestCase("changed-after-capture")]
        public void GeneratedDocumentationEnvelopeCultureSensitiveNumericArgumentsAreUnknown(string mode)
        {
            var original = CultureInfo.CurrentCulture;
            try
            {
                CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;
                object value = mode switch { "nan" => double.NaN, "infinity" => double.PositiveInfinity, _ => (object)(-1) };
                var docs = new XmlDocProvider(summary: new XmlDocSummaryStatement(new[] { FormattableStringFactory.Create("{0}", new[] { value }) }));
                var before = mode == "changed-after-capture" ? CaptureGeneratedDocumentation(docs) : null;
                var culture = (CultureInfo)CultureInfo.InvariantCulture.Clone();
                const string escape = "\npublic class Escaped {}\n//";
                culture.NumberFormat.NegativeSign = escape;
                culture.NumberFormat.NaNSymbol = escape;
                culture.NumberFormat.PositiveInfinitySymbol = escape;
                CultureInfo.CurrentCulture = culture;
                var envelope = mode == "changed-after-capture" ? before : CaptureGeneratedDocumentation(docs);
                using var writer = new CodeWriter();
                docs.Summary!.Write(writer);
                var output = writer.ToString(false) + "\npublic class Actual {}";
                var compilation = CallProofCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText(output));
                Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty, output);
                Assert.That(compilation.GetTypeByMetadataName("Escaped"), Is.Not.Null, output);
                Assert.That(envelope, Is.Null);
            }
            finally { CultureInfo.CurrentCulture = original; }
        }

        [TestCase("bool")]
        [TestCase("char")]
        [TestCase("string")]
        public void GeneratedDocumentationEnvelopeCultureIndependentScalarControlsRemainAvailable(string mode)
        {
            object value = mode switch { "bool" => true, "char" => (object)'x', _ => "safe" };
            var docs = new XmlDocProvider(summary: new XmlDocSummaryStatement(new[] { FormattableStringFactory.Create("{0}", new[] { value }) }));
            var envelope = CaptureGeneratedDocumentation(docs);
            Assert.That(envelope, Is.Not.Null);
            Assert.That(GraphMember(envelope!, "IsCurrent"), Is.True);
        }

        private static object? CaptureGeneratedDocumentation(XmlDocProvider docs)
        {
            var type = typeof(XmlDocProvider).Assembly.GetType("Microsoft.TypeSpec.Generator.Primitives.PreparedGeneratedDocumentationEnvelope");
            Assert.That(type, Is.Not.Null);
            var method = type!.GetMethod("TryCapture", BindingFlags.NonPublic | BindingFlags.Static);
            Assert.That(method, Is.Not.Null);
            return method!.Invoke(null, new object[] { docs });
        }

        private sealed class GeneratedCustomDoc(Action callback) : XmlDocStatement($"<item>", $"</item>", Array.Empty<FormattableString>())
        {
            internal override void WriteCore(CodeWriter writer) { callback(); writer.WriteRawLine("public class Escaped {}"); }
        }

        private sealed class GeneratedUnknownFormatter : FormattableString
        {
            public override string Format => throw new InvalidOperationException("Unknown formatter must not run.");
            public override int ArgumentCount => throw new InvalidOperationException("Unknown formatter must not run.");
            public override object? GetArgument(int index) => throw new InvalidOperationException("Unknown formatter must not run.");
            public override object?[] GetArguments() => throw new InvalidOperationException("Unknown formatter must not run.");
            public override string ToString(IFormatProvider? formatProvider) => throw new InvalidOperationException("Unknown formatter must not run.");
        }
    }
}
