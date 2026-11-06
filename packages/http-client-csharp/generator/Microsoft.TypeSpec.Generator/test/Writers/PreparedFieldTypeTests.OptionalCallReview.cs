// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [TestCase(LanguageVersion.CSharp3)]
        [TestCase(LanguageVersion.CSharp4)]
        public void OptionalReviewMetadataOmissionMatchesActualCompilerAdmission(LanguageVersion version)
        {
            var baseline = CallProofCompilation();
            var suffix = Guid.NewGuid().ToString("N");
            var helper = EmitReturnProofAssembly(baseline, "OptionalMetadata_" + suffix,
                "namespace OptionalProofFixture { public static class Probe { public static string SafeOptional(string value = \"safe\") { return value; } } }");
            using var helperStream = new MemoryStream(helper, writable: false);
            var type = AssemblyLoadContext.Default.LoadFromStream(helperStream).GetType("OptionalProofFixture.Probe")!;
            var options = new CSharpParseOptions(version);
            var compilation = baseline.AddReferences(MetadataReference.CreateFromImage(helper))
                .AddSyntaxTrees(CSharpSyntaxTree.ParseText("class OptionalVersionAnchor {}", options));
            Assert.That(compilation.LanguageVersion, Is.EqualTo(version));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(type), "SafeOptional", Array.Empty<ValueExpression>());
            using var writer = new CodeWriter();
            call.Write(writer);
            var tree = CSharpSyntaxTree.ParseText("public class Run { public static string M() { return " + writer.ToString(false) + "; } }", options);
            var emitted = compilation.WithAssemblyName("OptionalCaller_" + suffix).AddSyntaxTrees(tree);
            var errors = emitted.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
            var admitted = errors.Length == 0;
            TestContext.WriteLine(version + ": errors=" + errors.Length + "; " + string.Join(" | ", errors.Select(d => d.ToString())));
            var node = CaptureCallProof(call, compilation);
            Assert.That(node.CallProofs?.Selection is not null, Is.EqualTo(admitted));
            Assert.That(node.CallProofs?.ObservationAbsence is not null, Is.EqualTo(admitted));
            if (admitted)
            {
                using var output = new MemoryStream();
                var result = emitted.Emit(output);
                Assert.That(result.Success, Is.True, string.Join("\n", result.Diagnostics));
                var value = Assembly.Load(output.ToArray()).GetType("Run")!.GetMethod("M")!.Invoke(null, null);
                Assert.That(value, Is.EqualTo("safe"));
                TestContext.WriteLine(version + ": emitted call returned safe.");
            }
        }
    }
}
