// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.TestHelpers;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [TestCase("cr", false)]
        [TestCase("nel", false)]
        [TestCase("ls", false)]
        [TestCase("ps", false)]
        [TestCase("lf", true)]
        [TestCase("crlf", true)]
        [TestCase("ordinary", true)]
        [TestCase("none", true)]
        public void GeneratedHeaderReviewLicenseInputMustRemainInComments(string mode, bool expected)
        {
            var separator = mode switch { "cr" => "\r", "nel" => "\u0085", "ls" => "\u2028", "ps" => "\u2029", "lf" => "\n", "crlf" => "\r\n", _ => " " };
            var header = mode == "none" ? "" : mode == "ordinary" ? "ordinary license" :
                "license" + separator + "namespace Sample { public partial class GeneratedCalls {} }" + separator + "//";
            var configuration = JsonSerializer.Serialize(new Dictionary<string, object>
            {
                ["package-name"] = "Sample.Namespace",
                ["disable-xml-docs"] = true,
                ["license"] = new { name = "test", company = "test", link = "", description = "test", header }
            });
            MockHelpers.LoadMockGenerator(configuration: configuration);
            var target = new GeneratedReviewOwner("suppression");
            target.EnsureBuilt();
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(target.Type), "Safe", new ValueExpression[] { Literal(1) });
            var caller = new OccurrenceOwner(call, returnType: typeof(string));
            caller.EnsureBuilt();
            FinalizeGeneratedCallFixture(target);
            FinalizeGeneratedCallFixture(caller);
            Assert.That(CodeModelGenerator.Instance.LicenseHeader, Is.EqualTo(header));
            var compilation = CallProofCompilation();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { target, caller }, compilation, _ => true);
            var occurrence = GeneratedReviewCallOccurrence(prepared, call);
            var selection = occurrence.CallProofs?.Selection;
            var absence = occurrence.CallProofs?.ObservationAbsence;
            var outputs = new TypeProvider[] { target, caller }.Select(owner => new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write()).ToArray();
            var errors = compilation.AddSyntaxTrees(outputs.Select(o => CSharpSyntaxTree.ParseText(o.Content))).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
            if (expected)
            {
                Assert.That(errors, Is.Empty);
                Assert.That(selection?.IsCurrent, Is.True);
                Assert.That(absence?.IsCurrent, Is.True);
            }
            else
            {
                Assert.That(outputs[0].Content, Does.Contain(separator + "namespace Sample { public partial class GeneratedCalls {} }"));
                Assert.That(errors.Any(e => e.Id == "CS0101"), Is.True, string.Join("\n", errors.Select(e => e.ToString())));
                Assert.That(selection, Is.Null);
                Assert.That(absence, Is.Null);
            }
        }

        [TestCase(false, false)]
        [TestCase(true, false)]
        [TestCase(false, true)]
        [TestCase(true, true)]
        public void CallHeaderReviewLicenseInputCanChangeActualBinding(bool source, bool control)
        {
            var payload = source ? "namespace SourceCalls { public static partial class Probe { public static string Safe(int value) => \"shadow\"; } }" :
                "namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers { public static partial class PreparedKeywordCallProbe { public static string Safe(int value) => \"shadow\"; } }";
            var separator = control ? "\n" : "\r";
            var header = "license" + separator + payload + separator + "//";
            MockHelpers.LoadMockGenerator(configuration: JsonSerializer.Serialize(new Dictionary<string, object>
            {
                ["package-name"] = "Sample.Namespace", ["disable-xml-docs"] = true,
                ["license"] = new { name = "test", company = "test", link = "", description = "test", header }
            }));
            var compilation = source ? LoadedSourceCallCompilation("public static string Safe(object value) => \"safe\";") : CallProofCompilation();
            CSharpType type = source ? LoadedSourceCallType() : typeof(PreparedKeywordCallProbe);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(type), "Safe", new ValueExpression[] { Literal(1) });
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.Update(@namespace: type.Namespace);
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var occurrence = GeneratedReviewCallOccurrence(prepared, call);
            var selection = occurrence.CallProofs?.Selection;
            var absence = occurrence.CallProofs?.ObservationAbsence;
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            var tree = CSharpSyntaxTree.ParseText(output.Content);
            compilation = compilation.WithAssemblyName("HeaderBinding_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(tree);
            Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty, output.Content);
            var invocation = tree.GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>().Single();
            var actual = (IMethodSymbol)compilation.GetSemanticModel(tree).GetSymbolInfo(invocation).Symbol!;
            Assert.That(actual, Is.Not.Null);
            if (!control)
            {
                Assert.That(SymbolEqualityComparer.Default.Equals(actual.ContainingAssembly, compilation.Assembly), Is.True);
                Assert.That(actual.Parameters[0].Type.SpecialType, Is.EqualTo(SpecialType.System_Int32));
            }
            using var stream = new MemoryStream();
            var emitted = compilation.Emit(stream);
            Assert.That(emitted.Success, Is.True, string.Join("\n", emitted.Diagnostics));
            var assembly = System.Reflection.Assembly.Load(stream.ToArray());
            var runtimeType = assembly.GetType(type.Namespace + ".OccurrenceOwner")!;
            var runtime = (string)runtimeType.GetMethod("M")!.Invoke(Activator.CreateInstance(runtimeType), null)!;
            Assert.That(runtime, Is.EqualTo(control ? "safe" : "shadow"));
            if (control)
            {
                Assert.That(selection, Is.Not.Null);
                Assert.That(absence, Is.Not.Null);
            }
            else
            {
                Assert.That(selection, Is.Null);
                Assert.That(absence, Is.Null);
            }
        }

        [TestCase(false, false)]
        [TestCase(true, false)]
        [TestCase(false, true)]
        [TestCase(true, true)]
        public void CallKeywordReviewDelegateFieldUsesActualRawSpelling(bool direct, bool control)
        {
            var name = control ? "SafeField" : "namespace";
            var receiver = TypeReferenceExpression.FromType(typeof(PreparedKeywordCallProbe));
            var call = direct ? new InvokeMethodExpression(receiver, name, new ValueExpression[] { Literal(1) }) :
                new InvokeMethodExpression(new MemberExpression(receiver, name), "Invoke", new ValueExpression[] { Literal(1) });
            var compilation = CallProofCompilation();
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var occurrence = GeneratedReviewCallOccurrence(prepared, call);
            var selection = occurrence.CallProofs?.Selection;
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            var errors = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
            if (control)
            {
                Assert.That(errors, Is.Empty);
                Assert.That(selection, Is.Not.Null);
            }
            else
            {
                Assert.That(output.Content, Does.Contain(".namespace"));
                Assert.That(errors, Is.Not.Empty);
                Assert.That(selection, Is.Null, string.Join("\n", errors.Select(e => e.ToString())));
            }
        }

        [TestCase(false, "class", false)]
        [TestCase(false, "event", false)]
        [TestCase(false, "Safe", true)]
        [TestCase(true, "class", false)]
        [TestCase(true, "event", false)]
        [TestCase(true, "Safe", true)]
        public void CallKeywordReviewActualMetadataAndSourceSpellingGovernsFacts(bool source, string name, bool expected)
        {
            var compilation = CallProofCompilation();
            CSharpType type = typeof(PreparedKeywordCallProbe);
            if (source)
            {
                compilation = LoadedSourceCallCompilation("public static string @class(int value) => \"safe\"; public static string @event(int value, [global::System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")] string expression = \"\") => expression; public static string Safe(int value) => \"safe\";");
                type = LoadedSourceCallType();
            }
            Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(type), name, new ValueExpression[] { Literal(1) });
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var occurrence = GeneratedReviewCallOccurrence(prepared, call);
            var selection = occurrence.CallProofs?.Selection;
            var absence = occurrence.CallProofs?.ObservationAbsence;
            var output = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            var errors = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText(output.Content)).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
            if (expected)
            {
                Assert.That(errors, Is.Empty);
                Assert.That(selection, Is.Not.Null);
                Assert.That(absence, Is.Not.Null);
            }
            else
            {
                Assert.That(output.Content, Does.Contain("." + name + "(1)"));
                Assert.That(errors, Is.Not.Empty);
                Assert.That(selection, Is.Null, string.Join("\n", errors.Select(e => e.ToString())));
                Assert.That(absence, Is.Null);
            }
        }
    }
}
