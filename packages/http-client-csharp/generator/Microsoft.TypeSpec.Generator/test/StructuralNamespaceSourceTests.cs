// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        [TestCase(0)]
        [TestCase(1)]
        [TestCase(2)]
        [TestCase(3)]
        [TestCase(4)]
        [TestCase(5)]
        [TestCase(6)]
        [TestCase(7)]
        [TestCase(8)]
        [TestCase(9)]
        [TestCase(10)]
        [TestCase(11)]
        public async Task UnobservedCallSourceAllowsNamespaceReduction(int kind)
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System; using System.Runtime.CompilerServices; namespace Sample { public class Clock { public object M(object value) {");
                writer.WriteLine($"{typeof(Exception)} seed = default;");
                switch (kind)
                {
                    case 0: writer.WriteLine($"return Pass(new {typeof(Exception)}());"); break;
                    case 1: writer.WriteLine($"return Pass(typeof({typeof(Exception)}));"); break;
                    case 2: writer.WriteLine($"return Pass(default({typeof(Exception)}));"); break;
                    case 3: writer.WriteLine($"return Pass(new {typeof(Exception)}[1]);"); break;
                    case 4: writer.WriteLine($"return Pass(({typeof(Exception)})(value));"); break;
                    case 5: writer.WriteLine($"return new Consumer(new {typeof(Exception)}());"); break;
                    case 6: writer.WriteLine($"return new {typeof(Exception)}().IdentityExtension();"); break;
                    case 7: writer.WriteLine($"return Generic<{typeof(Exception)}>();"); break;
                    case 8: writer.WriteLine($"return CaptureOther(\"fixed\", new {typeof(Exception)}());"); break;
                    case 9: writer.WriteLine($"return Capture(new {typeof(Exception)}(), text: \"chosen\");"); break;
                    case 10: writer.WriteLine($"return new CapturedConsumer(new {typeof(Exception)}(), text: \"chosen\");"); break;
                    default: writer.WriteLine($"return new {typeof(Exception)}().CapturedExtension(text: \"chosen\");"); break;
                }
                writer.WriteRawLine("} private object Pass(object value) => value; private object Generic<T>() => typeof(T);");
                writer.WriteRawLine("private string CaptureOther(object first, object value, [CallerArgumentExpression(\"first\")] string text = \"\") => text;");
                writer.WriteRawLine("private string Capture(object value, [CallerArgumentExpression(\"value\")] string text = \"\") => text; }");
                writer.WriteRawLine("public class Consumer { public Consumer(object value) {} } public class CapturedConsumer { public CapturedConsumer(object value, [CallerArgumentExpression(\"value\")] string text = \"\") {} }");
                writer.WriteRawLine("public static class Extensions { public static object IdentityExtension(this object value) => value; public static string CapturedExtension(this object value, [CallerArgumentExpression(\"value\")] string text = \"\") => text; } }");
            });
            var output = await Reduce(code);
            StringAssert.DoesNotContain("global::System.Exception", output);
            AssertOperationBindings(code.Content, output);
        }

        [Test]
        public async Task OrdinaryConstructorInitializerSourceCanReduce()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Base { public Base(object value) {} } public class Clock : Base {");
                writer.WriteLine($"public Clock() : base(new {typeof(Exception)}()) {{ }}");
                writer.WriteRawLine("} }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("base(new Exception())", output);
            StringAssert.DoesNotContain("global::", output);
            AssertOperationBindings(code.Content, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task OuterCapturedArgumentStillProtectsNestedOrdinaryCall(bool receiver)
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System.Runtime.CompilerServices; namespace Sample { public class Clock { public object M() {");
                writer.WriteLine($"{typeof(Exception)} seed = default;");
                if (receiver)
                {
                    writer.WriteLine($"return Pass(new {typeof(Exception)}()).CapturedExtension();");
                }
                else
                {
                    writer.WriteLine($"return Capture(Pass(new {typeof(Exception)}()));");
                }

                writer.WriteRawLine("} private object Pass(object value) => value; private string Capture(object value, [CallerArgumentExpression(\"value\")] string text = \"\") => text; }");
                writer.WriteRawLine("public static class Extensions { public static string CapturedExtension(this object value, [CallerArgumentExpression(\"value\")] string text = \"\") => text; } }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("Pass(new global::System.Exception())", output);
            AssertOperationBindings(code.Content, output);
        }

        [Test]
        public async Task DynamicCallsRemainConservative()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public class Clock { public object M(dynamic api) {");
                writer.WriteLine($"return api.Pass(new {typeof(Exception)}());");
                writer.WriteRawLine("} } }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("new global::System.Exception()", output);
            AssertOperationBindings(code.Content, output);
        }

        [Test]
        public async Task DelegateInvokeCallerExpressionRemainsExact()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System.Runtime.CompilerServices; namespace Sample { public delegate string CaptureDelegate(object value, [CallerArgumentExpression(\"value\")] string text = \"\"); public class Clock { public string M(CaptureDelegate capture) {");
                writer.WriteLine($"return capture(new {typeof(Exception)}());");
                writer.WriteRawLine("} } }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("new global::System.Exception()", output);
            AssertOperationBindings(code.Content, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task ReorderedArgumentsUseParameterIdentityRatherThanEvaluationOrder(bool captureValue)
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System.Runtime.CompilerServices; namespace Sample { public class Clock { public object M() {");
                writer.WriteLine($"return Capture(value: new {typeof(Exception)}(), first: \"fixed\");");
                writer.WriteRawLine("} private object Capture(object first, object value, [CallerArgumentExpression(\"" + (captureValue ? "value" : "first") + "\")] string text = \"\") => text; } }");
            });
            var output = await Reduce(code);
            if (captureValue)
            {
                StringAssert.Contains("new global::System.Exception()", output);
            }
            else
            {
                StringAssert.DoesNotContain("global::System.Exception", output);
            }

            AssertOperationBindings(code.Content, output);
        }

        [Test]
        public async Task MultipleOmittedCaptureParametersProtectBothSources()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System.Runtime.CompilerServices; namespace Sample { public class Clock { public object M() {");
                writer.WriteLine($"return Capture(new {typeof(Exception)}(), typeof({typeof(Exception)}));");
                writer.WriteRawLine("} private object Capture(object first, object second, [CallerArgumentExpression(\"first\")] string a = \"\", [CallerArgumentExpression(\"second\")] string b = \"\") => a + b; } }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("new global::System.Exception()", output);
            StringAssert.Contains("typeof(global::System.Exception)", output);
            AssertOperationBindings(code.Content, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task EnclosingCallProofCoversLambdaSource(bool captured)
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System; using System.Runtime.CompilerServices; namespace Sample { public class Clock { public object M() {");
                writer.WriteLine($"return Capture(() => typeof({typeof(Exception)}));");
                writer.WriteRawLine("} private object Capture(Func<Type> make" + (captured ? ", [CallerArgumentExpression(\"make\")] string text = \"\"" : "") + ") => make; } }");
            });
            var output = await Reduce(code);
            if (captured)
            {
                StringAssert.Contains("typeof(global::System.Exception)", output);
            }
            else
            {
                StringAssert.DoesNotContain("global::System.Exception", output);
            }

            AssertOperationBindings(code.Content, output);
        }

        [Test]
        public async Task DelegateContractNotImplementationAttributesControlsCapture()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System.Runtime.CompilerServices; namespace Sample { public delegate object PlainDelegate(object value, string text = \"\"); public class Clock { public object M() { PlainDelegate callback = Target;");
                writer.WriteLine($"return callback(new {typeof(Exception)}());");
                writer.WriteRawLine("} private object Target(object value, [CallerArgumentExpression(\"value\")] string text = \"\") => text; } }");
            });
            var output = await Reduce(code);
            StringAssert.DoesNotContain("global::System.Exception", output);
            AssertOperationBindings(code.Content, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task PartialMethodCaptureAttributesAreReadFromCombinedSymbol(bool onImplementation)
        {
            var attribute = "[System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")] ";
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("namespace Sample { public partial class Clock { public object M() {");
                writer.WriteLine($"return Capture(new {typeof(Exception)}());");
                writer.WriteRawLine("} private partial object Capture(object value, " + (onImplementation ? "" : attribute) + "string text = \"\");");
                writer.WriteRawLine("private partial object Capture(object value, " + (onImplementation ? attribute : "") + "string text) => text; } }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("new global::System.Exception()", output);
            AssertOperationBindings(code.Content, output);
        }

        [Test]
        public async Task MultilineRemovedPrefixCannotShiftCallerLineNumber()
        {
            const string source = "using System; using System.Runtime.CompilerServices; namespace Sample { public class Clock { public object M() { var value = Pass(new global::System.\nException()); return Line(); } private object Pass(object value) => value; private int Line([CallerLineNumber] int line = 0) => line; } }";
            var node = CSharpSyntaxTree.ParseText(source).GetRoot().DescendantNodes().OfType<QualifiedNameSyntax>().Single(static name => name.Right.Identifier.ValueText == "Exception");
            var output = await Reduce(new CodeFile(source, "Clock.cs", new[] { new TypeReferenceSite(node.Span, typeof(Exception)) }));
            StringAssert.Contains("global::System.\nException", output);
            AssertOperationBindings(source, output);
        }

        [TestCase(0, false)]
        [TestCase(0, true)]
        [TestCase(1, false)]
        [TestCase(1, true)]
        [TestCase(2, false)]
        [TestCase(2, true)]
        public async Task AlternateCallRepresentationsHonorActualCaptureMapping(int kind, bool explicitText)
        {
            var suffix = explicitText ? ", text: \"chosen\"" : "";
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System.Runtime.CompilerServices; namespace Sample { public class Consumer { public Consumer(object value, [CallerArgumentExpression(\"value\")] string text = \"\") {} } public class Base { public Base(object value, [CallerArgumentExpression(\"value\")] string text = \"\") {} } public class Clock : Base {");
                if (kind == 2)
                {
                    writer.WriteLine($"public Clock() : base(new {typeof(Exception)}(){suffix}) {{ }}");
                }
                else
                {
                    writer.WriteRawLine("public Clock() : base(null) {} public object M() {");
                    if (kind == 0)
                    {
                        writer.WriteLine($"Consumer result = new(new {typeof(Exception)}(){suffix}); return result;");
                    }
                    else
                    {
                        writer.WriteLine($"return Extensions.CapturedExtension(new {typeof(Exception)}(){suffix});");
                    }

                    writer.WriteRawLine("}");
                }
                writer.WriteRawLine("} public static class Extensions { public static string CapturedExtension(this object value, [CallerArgumentExpression(\"value\")] string text = \"\") => text; } }");
            });
            var output = await Reduce(code);
            if (explicitText)
            {
                StringAssert.DoesNotContain("global::System.Exception", output);
            }
            else
            {
                StringAssert.Contains("new global::System.Exception()", output);
            }

            AssertOperationBindings(code.Content, output);
        }

        [Test]
        public async Task CapturedCallDoesNotContaminateAnOrdinarySiblingCall()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System.Runtime.CompilerServices; namespace Sample { public class Clock { public object M() {");
                writer.WriteLine($"var first = Capture(new {typeof(Exception)}());");
                writer.WriteLine($"return Pass(new {typeof(Exception)}());");
                writer.WriteRawLine("} private object Pass(object value) => value; private object Capture(object value, [CallerArgumentExpression(\"value\")] string text = \"\") => text; } }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("Capture(new global::System.Exception())", output);
            StringAssert.Contains("Pass(new Exception())", output);
            AssertOperationBindings(code.Content, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void OperationOracleObservesImplicitCreationAndConstructorInitializerCapture(bool initializer)
        {
            const string helpers = "using System; using System.Runtime.CompilerServices; class Consumer { public Consumer(object value, [CallerArgumentExpression(\"value\")] string text = \"\") {} } ";
            var source = helpers + (initializer
                ? "class C : Consumer { public C() : base(new global::System.Exception()) {} }"
                : "class C { object M() { Consumer result = new(new global::System.Exception()); return result; } }");
            Assert.Throws<AssertionException>(() => AssertOperationBindings(source, source.Replace("global::System.Exception", "Exception")));
        }

        [Test]
        public async Task ConditionalReceiverBindingCannotReuseOriginalCallProof()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System.Runtime.CompilerServices; namespace Sample { public class Captured { public object Pass(object value, [CallerArgumentExpression(\"value\")] string text = \"\") => text; } public class Plain { public object Pass(object value) => value; } public class Clock { public object M() {\n#if NET8_0_OR_GREATER\nvar api = new Captured();\n#else\nvar api = new Plain();\n#endif");
                writer.WriteLine($"return api.Pass(new {typeof(Exception)}());");
                writer.WriteRawLine("} } }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("new global::System.Exception()", output);
            foreach (var options in new[] { new CSharpParseOptions(), new CSharpParseOptions().WithPreprocessorSymbols("NET8_0_OR_GREATER") })
            {
                AssertOperationBindings(code.Content, output, options);
            }
        }
    }
}
