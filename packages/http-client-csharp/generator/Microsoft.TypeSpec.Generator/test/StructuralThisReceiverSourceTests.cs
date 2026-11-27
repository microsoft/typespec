// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public async Task StructuralThisReceiverOuterCaptureProtectsNestedLambda(bool explicitOverride)
        {
            var source = "using System; using System.Runtime.CompilerServices; class Clock { private int Value; " +
                "static int Inner(int x) => x; static string Capture(Func<int> f, [CallerArgumentExpression(\"f\")] string text = null) => text; " +
                "public string M() => Capture(() => Inner(this.Value)" + (explicitOverride ? ", \"manual\"" : "") + "); }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            Assert.That(output.Contains("this.Value"), Is.EqualTo(!explicitOverride));
            AssertThisMemberBindings(source, output);
        }

        [Test]
        public async Task StructuralThisReceiverUnrelatedCapturedArgumentCanReduce()
        {
            const string source = "using System.Runtime.CompilerServices; class Clock { private int Value; " +
                "static int Capture(int observed, int other, [CallerArgumentExpression(\"observed\")] string text = null) => other; " +
                "public int M() => Capture(1, this.Value); }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("Capture(1, Value)", output);
            AssertThisMemberBindings(source, output);
        }

        [TestCase(true)]
        [TestCase(false)]
        public async Task StructuralThisReceiverExtensionReceiverSourceObservation(bool observesReceiver)
        {
            var source = "using System.Runtime.CompilerServices; static class Extensions { public static int Observe(this int receiver, int argument, " +
                "[CallerArgumentExpression(\"" + (observesReceiver ? "receiver" : "argument") + "\")] string text = null) => receiver; } " +
                "class Clock { private int Value; public int M() => this.Value.Observe(1); }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            Assert.That(output.Contains("this.Value"), Is.EqualTo(observesReceiver));
            AssertThisMemberBindings(source, output);
        }

        [TestCase("\n")]
        [TestCase("\r\n")]
        public async Task StructuralThisReceiverMultilinePrefixPreservesLaterLineNumber(string newline)
        {
            var source = "using System.Runtime.CompilerServices; class Clock { private int Value; " +
                "static int Line([CallerLineNumber] int line = 0) => line; public int M() { int x = this" + newline + ".Value; return x + Line(); } }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("this" + newline + ".Value", output);
            AssertThisMemberBindings(source, output);
        }

        [TestCase(true)]
        [TestCase(false)]
        public async Task StructuralThisReceiverIndependentMethodScopeOrder(bool shadowFirst)
        {
            const string shadowed = "public int A(int Value) => this.Value; ";
            const string unshadowed = "public int B() => this.Value; ";
            var source = "class Clock { private int Value; " + (shadowFirst ? shadowed + unshadowed : unshadowed + shadowed) + "}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("A(int Value) => this.Value", output);
            StringAssert.Contains("B() => Value", output);
            AssertThisMemberBindings(source, output);
        }

        [Test]
        public async Task StructuralThisReceiverNoTypeSitesDoesNotAuthorizeStaticOrNamespaceEdits()
        {
            const string source = "class Clock { private int Value; public int M() => this.Value + global::System.Int32.MaxValue; }";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.DoesNotContain("this.Value", output);
            StringAssert.Contains("global::System.Int32.MaxValue", output);
            AssertThisMemberBindings(source, output);
        }

        [Test]
        public void StructuralThisReceiverOracleDetectsCallerSourceConstantCorruption()
        {
            const string source = "using System.Runtime.CompilerServices; class Clock { private int Value; " +
                "static int Capture(int x, [CallerArgumentExpression(\"x\")] string text = null) => x; public int M() => Capture(this.Value); }";
            Assert.Throws<AssertionException>(() => AssertThisMemberBindings(source, source.Replace("Capture(this.Value)", "Capture(Value)")));
        }
    }
}
