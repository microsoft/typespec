// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Text;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        [TestCase(false, false)]
        [TestCase(true, false)]
        [TestCase(false, true)]
        [TestCase(true, true)]
        public async Task StructuralC5HandlerConstructorCallerExpressionPreservesSiblingSource(bool conditional, bool nested)
        {
            const string types = "using System.Runtime.CompilerServices;[InterpolatedStringHandler]public ref struct H{public readonly string Text;public H(int literalLength,int formattedCount,Sample.Clock receiver,[CallerArgumentExpression(\"receiver\")]string text=\"\"){Text=text;}public void AppendLiteral(string text){}public void AppendFormatted(int value){}}";
            const string receiver = "global::Sample.Clock";
            var value = nested ? "Wrap(" + receiver + ".Make())" : receiver + ".Make()";
            var source = types + "namespace Sample{public class Clock{public static Clock Make()=>new Clock();private static Clock Wrap(Clock value)=>value;private static string Capture(Clock value,[InterpolatedStringHandlerArgument(\"value\")]H handler)=>handler.Text;public static string Entry()=>Capture(" + value + ",$\"{1}\");" + (conditional ? ConditionalParenthesesBranch : "") + "}}";
            var target = new CSharpType("Clock", "Sample", false, false, null, Array.Empty<CSharpType>(), true, false);
            var site = new TypeReferenceSite(new TextSpan(source.IndexOf(receiver, StringComparison.Ordinal), receiver.Length), target);
            var output = await Reduce(new CodeFile(source, "Clock.cs", new[] { site }));
            var original = ExecuteC5Capture(source);
            Assert.That(original, Is.EqualTo(value));
            Assert.That(ExecuteC5Capture(output), Is.EqualTo(original), "Synthesized handler constructors can capture sibling source even when the selected enclosing method has no CAE parameter.");
            StringAssert.Contains(value, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StructuralC5UnobservedStaticReceiverStillReduces(bool conditional)
        {
            const string receiver = "global::Sample.Clock";
            var source = "namespace Sample{public class Clock{public static int Number()=>1;public static int Entry()=>" + receiver + ".Number();" + (conditional ? ConditionalParenthesesBranch : "") + "}}";
            var target = new CSharpType("Clock", "Sample", false, false, null, Array.Empty<CSharpType>(), true, false);
            var site = new TypeReferenceSite(new TextSpan(source.IndexOf(receiver, StringComparison.Ordinal), receiver.Length), target);
            var output = await Reduce(new CodeFile(source, "Clock.cs", new[] { site }));
            StringAssert.Contains("Entry()=>Clock.Number()", output);
        }

        private static string ExecuteC5Capture(string source)
        {
            var refs = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(Path.PathSeparator).Select(static path => MetadataReference.CreateFromFile(path));
            var compilation = CSharpCompilation.Create("C5HandlerRegression", new[] { CSharpSyntaxTree.ParseText(source) }, refs, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            using var pe = new MemoryStream();
            var emitted = compilation.Emit(pe);
            Assert.That(emitted.Success, Is.True, string.Join(";", emitted.Diagnostics));
            return (string)Assembly.Load(pe.ToArray()).GetType("Sample.Clock")!.GetMethod("Entry")!.Invoke(null, null)!;
        }
    }
}
