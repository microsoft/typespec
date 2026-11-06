// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using System.Reflection;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Tests.TestHelpers;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [TestCase(false, false)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(true, true)]
        public void CallProofMissingReturnDependencyVetoesBothCertificates(bool nestedReturn, bool includeDependency)
        {
            var suffix = Guid.NewGuid().ToString("N");
            var baseline = CallProofCompilation();
            var dependency = EmitReturnProofAssembly(baseline, "ReturnDependency_" + suffix,
                "namespace CallProofDependency { public class Result {} }");
            var dependencyReference = MetadataReference.CreateFromImage(dependency);
            var returnType = nestedReturn ? "System.Collections.Generic.List<CallProofDependency.Result>" : "CallProofDependency.Result";
            var helper = EmitReturnProofAssembly(baseline.AddReferences(dependencyReference), "ReturnHelpers_" + suffix,
                "namespace CallProofFixtures { public static class Probe { public static " + returnType + " Safe(int value) => null; } }");
            // Reflection can load the declaring type without inspecting its return type.
            // Only the preparation compilation's reference universe is authoritative.
            var runtimeType = Assembly.Load(helper).GetType("CallProofFixtures.Probe")!;
            var compilation = baseline.AddReferences(MetadataReference.CreateFromImage(helper));
            if (includeDependency) { compilation = compilation.AddReferences(dependencyReference); }
            var method = compilation.GetTypeByMetadataName("CallProofFixtures.Probe")!.GetMembers("Safe").OfType<IMethodSymbol>().Single();
            Assert.That(method.HasUnsupportedMetadata, Is.False, "This flag does not establish complete return-type dependencies.");
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(runtimeType), "Safe", new ValueExpression[] { Literal(1) });
            using var writer = new CodeWriter();
            call.Write(writer);
            var emitted = compilation.AddSyntaxTrees(CSharpSyntaxTree.ParseText("public class Run { public static object M() => " + writer.ToString(false) + "; }"));
            var errors = emitted.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
            if (includeDependency) { Assert.That(errors, Is.Empty); }
            else { Assert.That(errors.Any(d => d.Id == "CS0012"), Is.True, string.Join("\n", errors.Select(d => d.ToString()))); }
            var proofs = RequireCallProofs(CaptureCallProof(call, compilation));
            Assert.That(ProofProperty(proofs, "Selection"), includeDependency ? Is.Not.Null : Is.Null);
            Assert.That(ProofProperty(proofs, "ObservationAbsence"), includeDependency ? Is.Not.Null : Is.Null);
        }

        private static byte[] EmitReturnProofAssembly(CSharpCompilation baseline, string name, string source)
        {
            var compilation = baseline.WithAssemblyName(name).AddSyntaxTrees(CSharpSyntaxTree.ParseText(source));
            using var stream = new MemoryStream();
            var result = compilation.Emit(stream);
            Assert.That(result.Success, Is.True, string.Join("\n", result.Diagnostics));
            return stream.ToArray();
        }
    }
}
