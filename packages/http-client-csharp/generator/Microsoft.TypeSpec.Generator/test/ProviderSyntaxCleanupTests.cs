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
    [NonParallelizable]
    public class ProviderSyntaxCleanupTests
    {
        private static readonly MetadataReference[] References = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!)
            .Split(Path.PathSeparator).Select(static p => MetadataReference.CreateFromFile(p)).ToArray();

        [Test]
        public void WholeExpressionParenthesesAreRemovedWithoutChangingResults()
        {
            var source = "namespace Example { public class Consumer { public int M(int a,int b,int c) { int value=(a+b); if ((value>c)) return (value-c); return (a+(b*c)); } } }";
            var output = Reduce(source);
            StringAssert.DoesNotContain("if ((", output);
            StringAssert.DoesNotContain("return (value-c)", output);
            Assert.AreEqual(Run(source, 3, 4, 2), Run(output, 3, 4, 2));
            Assert.AreEqual(Run(source, 1, 2, 5), Run(output, 1, 2, 5));
        }

        [Test]
        public void RightAssociatedFloatingPointGroupingIsPreserved()
        {
            var source = "namespace Example { public class Consumer { public double M(double a,double b,double c) => (a+(b+c)); } }";
            var output = Reduce(source);
            StringAssert.Contains("b+c", output);
            Assert.AreEqual(Run(source, 1e16, -1e16, 1d), Run(output, 1e16, -1e16, 1d));
        }

        [Test]
        public void KnownFieldAndPropertyReceiversAreRemoved()
        {
            var source = "namespace Example { public class Consumer { private int _field=3; public int Value=>4; public int M()=>this._field+this.Value; } }";
            var output = Reduce(source);
            StringAssert.DoesNotContain("this._field", output);
            StringAssert.DoesNotContain("this.Value", output);
            Assert.AreEqual(Run(source), Run(output));
        }

        [Test]
        public void ShadowedFieldReceiverIsPreserved()
        {
            var source = "namespace Example { public class Consumer { private int _field=3; public int M(int _field)=>this._field+_field; } }";
            var output = Reduce(source);
            StringAssert.Contains("this._field", output);
            Assert.AreEqual(Run(source, 10), Run(output, 10));
        }

        [Test]
        public void QueryVariableCannotCaptureRemovedThisReceiver()
        {
            var source = "using System.Linq; namespace Example { public class Consumer { public int Value=5; public int M()=>(from Value in new[]{2} select this.Value).Single(); } }";
            var output = Reduce(source);
            StringAssert.Contains("this.Value", output);
            Assert.AreEqual(Run(source), Run(output));
        }

        [Test]
        public void ObjectWorkaroundAndMethodReceiverArePreserved()
        {
            var source = "namespace Example { public class Consumer { public int Object=>4; private int F()=>2; public int M()=>this.Object+this.F(); } }";
            var output = Reduce(source);
            StringAssert.Contains("this.Object", output);
            StringAssert.Contains("this.F()", output);
            Assert.AreEqual(Run(source), Run(output));
        }

        [Test]
        public void CombinedNestedDeletionsCannotFuseReturnAndLiteral()
        {
            var source = "namespace Example { public class Consumer { public int M() { return((1)+(2)); } } }";
            var output = Reduce(source);
            Assert.AreEqual(3, Run(output));
        }

        [Test]
        public void DelegateInvocationParenthesisChainCannotBecomeACast()
        {
            var source = "namespace Example { public class Consumer { public int M() { System.Func<int,int> f=x=>x+1; return ((f))(1); } } }";
            var output = Reduce(source);
            Assert.AreEqual(2, Run(output));
        }

        [TestCase("public int M(int x) { return(x); }", 3)]
        [TestCase("public object M(object x) => (x)as object;", 3)]
        [TestCase("public bool M(object x) => x is(int);", 3)]
        [TestCase("public int Value=>4; public int M(int x) { return(this.Value); }", 3)]
        public void WhitespaceFreeBoundariesDoNotMergeTokens(string members, int input)
        {
            var source = "namespace Example { public class Consumer { " + members + " } }";
            var output = Reduce(source);
            Assert.AreEqual(Run(source, input), Run(output, input));
        }

        [Test]
        public void PrimaryConstructorInOtherPartialCannotCaptureThisField()
        {
            var source = "namespace Example { public partial class Consumer { public int M()=>this.Value; } }";
            var extra = "namespace Example { public class Base { public int Value=1; } public partial class Consumer(int Value) : Base {} }";
            var tree = CSharpSyntaxTree.ParseText(source);
            var compilation = CSharpCompilation.Create("PrimaryConstructor", new[] { tree, CSharpSyntaxTree.ParseText(extra) }, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.True(new ProviderNameReducer(compilation).TryPlan(tree.GetRoot(), Array.Empty<TypeReferenceSite>(), out var plan));
            var output = plan!.Apply().ToString();
            var after = compilation.ReplaceSyntaxTree(tree, CSharpSyntaxTree.ParseText(output));
            using var bytes = new MemoryStream();
            var result = after.Emit(bytes);
            Assert.That(result.Diagnostics.Where(static d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            var type = Assembly.Load(bytes.ToArray()).GetType("Example.Consumer")!;
            Assert.AreEqual(1, type.GetMethod("M")!.Invoke(Activator.CreateInstance(type, 9), null));
            StringAssert.Contains("this.Value", output);
        }

        private static string Reduce(string source)
        {
            var tree = CSharpSyntaxTree.ParseText(source);
            var compilation = CSharpCompilation.Create("Cleanup", new[] { tree }, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            AssertNoErrors(compilation);
            Assert.True(new ProviderNameReducer(compilation).TryPlan(tree.GetRoot(), Array.Empty<TypeReferenceSite>(), out var plan));
            var output = plan!.Apply().ToString();
            AssertNoErrors(compilation.ReplaceSyntaxTree(tree, CSharpSyntaxTree.ParseText(output)));
            return output;
        }

        private static object? Run(string source, params object[] arguments)
        {
            var compilation = CSharpCompilation.Create("CleanupRuntime", new[] { CSharpSyntaxTree.ParseText(source) }, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            using var stream = new MemoryStream();
            var result = compilation.Emit(stream);
            Assert.That(result.Diagnostics.Where(static d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            var type = Assembly.Load(stream.ToArray()).GetType("Example.Consumer")!;
            return type.GetMethod("M")!.Invoke(Activator.CreateInstance(type), arguments);
        }

        private static void AssertNoErrors(Compilation compilation) => Assert.That(
            compilation.GetDiagnostics().Where(static d => d.Severity == DiagnosticSeverity.Error).Select(static d => d.ToString()), Is.Empty);
    }
}
