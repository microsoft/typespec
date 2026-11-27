// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using System.Threading;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    [NonParallelizable]
    public class OptionalDefaultEmissionTests
    {
        [SetUp]
        public void SetUp() => MockHelpers.LoadMockGenerator();

        private static readonly MetadataReference[] References = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!)
            .Split(Path.PathSeparator).Select(static path => MetadataReference.CreateFromFile(path)).ToArray();

        [TestCase(typeof(CancellationToken))]
        [TestCase(typeof(DateTimeOffset))]
        [TestCase(typeof(Guid))]
        [TestCase(typeof(int))]
        [TestCase(typeof(DayOfWeek))]
        [TestCase(typeof(CancellationToken?))]
        [TestCase(typeof(string))]
        public void CastDefaultParameterCompilesWithoutSimplification(Type type)
        {
            using var writer = new CodeWriter();
            writer.AppendRaw("public static class Consumer { public static void M(");
            writer.WriteParameter(new ParameterProvider("value", $"The value.", new CSharpType(type), new CastExpression(Default, new CSharpType(type))));
            writer.AppendRaw(") { } }");
            var compilation = CSharpCompilation.Create("RawDefaults", [CSharpSyntaxTree.ParseText(writer.ToString())], References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.That(compilation.GetDiagnostics().Where(static d => d.Severity == DiagnosticSeverity.Error), Is.Empty, writer.ToString());
        }

        [Test]
        public void DifferentCastTypeInParameterIsUnchanged()
        {
            using var writer = new CodeWriter();
            writer.WriteParameter(new ParameterProvider("value", $"The value.", typeof(long), new CastExpression(Default, typeof(int))));
            Assert.AreEqual("long value = ((int)default)", writer.ToString(false));
        }

        [Test]
        public void BareDefaultInParameterIsUnchanged()
        {
            using var writer = new CodeWriter();
            writer.WriteParameter(new ParameterProvider("value", $"The value.", typeof(CancellationToken), Default));
            Assert.AreEqual("global::System.Threading.CancellationToken value = default", writer.ToString(false));
        }

        [Test]
        public void CastDefaultOutsideParameterIsUnchanged()
        {
            using var writer = new CodeWriter();
            new CastExpression(Default, typeof(CancellationToken)).Write(writer);
            Assert.AreEqual("((global::System.Threading.CancellationToken)default)", writer.ToString(false));
        }
    }
}
