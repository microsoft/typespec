// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using System.Reflection.Metadata;
using System.Reflection.Metadata.Ecma335;
using System.Reflection.PortableExecutable;
using System.Runtime.Loader;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [TestCase(true, true)]
        [TestCase(true, false)]
        [TestCase(false, true)]
        [TestCase(false, false)]
        public void CalleeIdentityReviewEmittedMethodAndTypeNamesMatchClaimedTarget(bool methodAlias, bool useAlias)
        {
            var compilation = CallProofCompilation();
            var observing = "public static string M(int value, [System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")] string text = \"\") => text;";
            var source = methodAlias ? "namespace CalleeIdentityFixture { public static class Probe { " + observing +
                " public static string zq(int value) => \"not-actual\"; } }" :
                "namespace CalleeIdentityFixture { public static class A { " + observing +
                " } public static class zq { public static string M(int value) => \"not-actual\"; } }";
            var bytes = EmitReturnProofAssembly(compilation, "CalleeIdentity_" + Guid.NewGuid().ToString("N"), source);
            int offset;
            using (var stream = new MemoryStream(bytes, writable: false))
            using (var pe = new PEReader(stream))
            {
                var reader = pe.GetMetadataReader();
                var name = methodAlias ? reader.MethodDefinitions.Select(h => reader.GetMethodDefinition(h).Name).Single(h => reader.GetString(h) == "zq") :
                    reader.TypeDefinitions.Select(h => reader.GetTypeDefinition(h).Name).Single(h => reader.GetString(h) == "zq");
                offset = pe.PEHeaders.MetadataStartOffset + reader.GetHeapMetadataOffset(HeapIndex.String) + MetadataTokens.GetHeapOffset(name);
            }
            Assert.That(bytes.Skip(offset).Take(3), Is.EqualTo(new byte[] { (byte)'z', (byte)'q', 0 }));
            bytes[offset] = (byte)'@';
            bytes[offset + 1] = (byte)(methodAlias ? 'M' : 'A');
            using var helperStream = new MemoryStream(bytes, writable: false);
            var assembly = AssemblyLoadContext.Default.LoadFromStream(helperStream);
            var typeName = methodAlias ? "Probe" : useAlias ? "@A" : "A";
            var type = assembly.GetType("CalleeIdentityFixture." + typeName)!;
            compilation = compilation.AddReferences(MetadataReference.CreateFromImage(bytes));
            var call = new InvokeMethodExpression(TypeReferenceExpression.FromType(type), methodAlias && useAlias ? "@M" : "M", new ValueExpression[] { Literal(1) });
            var observed = EmitCallProof(call, compilation);
            Assert.That(observed.Value, Is.EqualTo("1"), "Actual emitted C# selects the observing plain-name target.");
            Assert.That(observed.Method.Name, Is.EqualTo("M"));
            Assert.That(observed.Method.ContainingType.Name, Is.EqualTo(methodAlias ? "Probe" : "A"));
            var node = CaptureCallProof(call, compilation);
            if (useAlias)
            {
                Assert.That(node.CallProofs?.Selection, Is.Null);
                Assert.That(node.CallProofs?.ObservationAbsence, Is.Null);
            }
            else
            {
                Assert.That(node.CallProofs?.Selection, Is.Not.Null);
                Assert.That(SymbolEqualityComparer.Default.Equals(node.CallProofs!.Selection!.Contract.DeclarationSymbol, observed.Method), Is.True);
                Assert.That(node.CallProofs.ObservationAbsence, Is.Null);
            }
        }
    }
}
