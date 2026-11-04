// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
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
        public void FileLocalSourceReviewCrossTreeTargetVisibility(bool fileLocal, bool observing)
        {
            var declaration = "namespace SourceCalls { " + (fileLocal ? "file" : "public") + " static class Probe { " +
                (observing
                    ? "public static string Observe(int value, [System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")] string expression = \"\") => expression;"
                    : "public static string Safe(int value) => \"safe\";") + " } }";
            var compilation = CallProofCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText(declaration, path: "Original.cs"));
            Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            var sourceNamespace = compilation.GlobalNamespace.GetNamespaceMembers().Single(n => n.Name == "SourceCalls");
            var target = sourceNamespace.GetTypeMembers("Probe").Single();
            Assert.That(target.IsFileLocal, Is.EqualTo(fileLocal));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(LoadedSourceCallType()), observing ? "Observe" : "Safe", new ValueExpression[] { Literal(1) });
            using var writer = new CodeWriter();
            call.Write(writer);
            var generated = CSharpSyntaxTree.ParseText("public class Run { public static string M() => " + writer.ToString(false) + "; }", path: "Generated.cs");
            var errors = compilation.AddSyntaxTrees(generated).GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
            if (fileLocal)
            {
                Assert.That(errors.Any(d => d.Id == "CS0234"), Is.True, string.Join("\n", errors.Select(d => d.ToString())));
            }
            else
            {
                Assert.That(errors, Is.Empty);
                Assert.That(EmitCallProof(call, compilation).Value, Is.EqualTo(observing ? "1" : "safe"));
            }
            var owner = new OccurrenceOwner(call, returnType: typeof(string));
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, call));
            if (fileLocal)
            {
                Assert.That(node.CallProofs?.Selection, Is.Null);
                Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
                Assert.That(GraphMember(GraphFacts(prepared, node), "DirectKnowledge")!.ToString(), Is.EqualTo("Unavailable"));
                Assert.That(GraphItems(GraphFacts(prepared, node), "OwnBarriers"), Is.Not.Empty);
            }
            else
            {
                Assert.That(node.CallProofs?.Selection, Is.Not.Null);
                Assert.That(node.CallProofs?.ObservationAbsence is not null, Is.EqualTo(!observing));
                Assert.That(GraphMember(GraphFacts(prepared, node), "DirectKnowledge")!.ToString(), Is.EqualTo("Known"));
            }
        }
    }
}
