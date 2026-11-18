// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using System.Reflection;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public class ProviderRetainedCleanupTests
    {
        private static readonly MetadataReference[] References = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!)
            .Split(Path.PathSeparator).Select(static p => MetadataReference.CreateFromFile(p)).ToArray();

        [Test]
        public void ExplicitGenericArgumentsPreventNonGenericOverloadSelection()
        {
            var source = "namespace Example { public class Consumer { static string Pick<T>(T x)=>\"generic\"; static string Pick(object x)=>\"nongeneric\"; public string M()=>Pick<object>(new object()); } }";
            var output = Reduce(source);
            StringAssert.Contains("Pick<object>", output);
            Assert.AreEqual("generic", Run(output));
            Assert.AreEqual("nongeneric", Run(source.Replace("Pick<object>(", "Pick(")));
        }

        [Test]
        public void TypedDefaultCastProtectsOverloadSelection()
        {
            var source = "namespace Example { public class Consumer { static string Pick(string x)=>\"string\"; static string Pick(int x)=>\"int\"; public string M()=>Pick((string)default); } }";
            var output = Reduce(source);
            StringAssert.Contains("(string)default", output);
            Assert.AreEqual("string", Run(output));
            var broken = Compile(source.Replace("(string)default", "default"));
            Assert.True(broken.GetDiagnostics().Any(static d => d.Severity == DiagnosticSeverity.Error));
        }

        [Test]
        public void TypedNullCastProtectsOverloadSelection()
        {
            var source = "namespace Example { public class Consumer { static string Pick(string x)=>\"string\"; static string Pick(object x)=>\"object\"; public string M()=>Pick((object)null); } }";
            var output = Reduce(source);
            StringAssert.Contains("(object)null", output);
            Assert.AreEqual("object", Run(output));
            Assert.AreEqual("string", Run(source.Replace("(object)null", "null")));
        }

        [Test]
        public void CompleteMemberReceiverCannotBeDroppedAcrossShadowing()
        {
            var source = "namespace Example { public class Consumer { public static int Value=>7; public int M() { int Value=1; return global::Example.Consumer.Value; } } }";
            var output = Reduce(source);
            StringAssert.Contains("Consumer.Value", output);
            Assert.AreEqual(7, Run(output));
            Assert.AreEqual(1, Run(source.Replace("global::Example.Consumer.Value", "Value")));
        }

        [Test]
        public void NameofConstantAloneDoesNotProveTargetIdentity()
        {
            var source = "namespace Example { public class Consumer { const string DateTimeOffset=\"local\"; public string M()=>nameof(global::System.DateTimeOffset); } }";
            var output = Reduce(source);
            StringAssert.Contains("global::System.DateTimeOffset", output);
            var shortened = source.Replace("global::System.DateTimeOffset", "DateTimeOffset");
            Assert.AreEqual(Run(source), Run(shortened), "Equal nameof strings cannot establish equal referenced symbols");
            Assert.AreNotEqual(NameofSymbol(source), NameofSymbol(shortened));
        }

        private static string NameofSymbol(string source)
        {
            var compilation = Compile(source);
            var tree = compilation.SyntaxTrees.Single();
            var argument = tree.GetRoot().DescendantNodes().OfType<Microsoft.CodeAnalysis.CSharp.Syntax.InvocationExpressionSyntax>()
                .Single().ArgumentList.Arguments.Single().Expression;
            var symbol = compilation.GetSemanticModel(tree).GetSymbolInfo(argument).Symbol!;
            return symbol.Kind + ":" + symbol.ToDisplayString();
        }

        [Test]
        public void RemovingNestedTypeOwnerCanSelectAnotherType()
        {
            var source = "namespace Example { public class Outer { public class Inner {} } public class Inner {} public class Consumer { public string M()=>typeof(global::Example.Outer.Inner).FullName!; } }";
            var output = Reduce(source);
            StringAssert.Contains("Outer.Inner", output);
            Assert.AreEqual("Example.Outer+Inner", Run(output));
            Assert.AreEqual("Example.Inner", Run(source.Replace("global::Example.Outer.Inner", "Inner")));
        }

        [Test]
        public void UnrecordedFrameworkLikeIdentifierMustNotBecomeKeyword()
        {
            var source = "namespace Example { public struct Byte {} public class Consumer { public string M()=>typeof(Byte).FullName!; } }";
            var output = Reduce(source);
            StringAssert.Contains("typeof(Byte)", output);
            Assert.AreEqual("Example.Byte", Run(output));
            Assert.AreEqual("System.Byte", Run(source.Replace("typeof(Byte)", "typeof(byte)")));
        }

        private static CSharpCompilation Compile(string source) => CSharpCompilation.Create("RetainedRules", new[] { CSharpSyntaxTree.ParseText(source) },
            References, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
        private static string Reduce(string source)
        {
            var compilation = Compile(source);
            Assert.That(compilation.GetDiagnostics().Where(static d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            Assert.True(new ProviderNameReducer(compilation).TryPlan(compilation.SyntaxTrees.Single().GetRoot(), Array.Empty<TypeReferenceSite>(), out var plan));
            return plan!.Apply().ToString();
        }
        private static object? Run(string source)
        {
            using var bytes = new MemoryStream();
            var result = Compile(source).Emit(bytes);
            Assert.That(result.Diagnostics.Where(static d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            var type = Assembly.Load(bytes.ToArray()).GetType("Example.Consumer")!;
            return type.GetMethod("M")!.Invoke(Activator.CreateInstance(type), null);
        }
    }
}
