// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Text;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        private static CodeFile ConditionalStaticFactorySites(string source)
        {
            var target = new CSharpType("Factory", "", false, false, null, Array.Empty<CSharpType>(), true, false);
            var matches = System.Text.RegularExpressions.Regex.Matches(source, "global::Factory");
            return new CodeFile(source, "Clock.cs", matches.Select(m => new TypeReferenceSite(new TextSpan(m.Index, m.Length), target)).ToArray());
        }

        [Test]
        public async Task StructuralConditionalStaticReceiverAsyncCollectionCaptureRemainsUnchanged()
        {
            const string types = "using System;using System.Threading.Tasks;using System.Runtime.CompilerServices;class Collection{}class Enumerator{public int Current=>1;public ValueTask<bool> MoveNextAsync()=>new ValueTask<bool>(false);}static class Recorder{public static string Text;}static class Extensions{public static Enumerator GetAsyncEnumerator(this Collection self,[CallerArgumentExpression(\"self\")]string text=null){Recorder.Text=text;return new Enumerator();}}static class Factory{public static Collection Create()=>new Collection();}";
            var source = types + "class Clock{public async Task<string> M(){await foreach(var value in global::Factory.Create()){}return Recorder.Text;}" + ConditionalParenthesesBranch + "}";
            var output = await Reduce(ConditionalStaticFactorySites(source));
            StringAssert.Contains("in global::Factory.Create()", output);
            AssertConditionalParenthesesOperations(source, output);
        }

        [Test]
        public async Task StructuralConditionalStaticReceiverLambdaInsideObservedCollectionCannotEscapeTheVeto()
        {
            var source = ConditionalStaticImplicitTypes + "class Clock{static Collection Select(Func<Collection> f)=>f();public string M(){foreach(var value in Select(()=>global::Factory.Create())){}return Recorder.Text;}" + ConditionalParenthesesBranch + "}";
            var output = await Reduce(ConditionalStaticFactorySites(source));
            StringAssert.Contains("()=>global::Factory.Create()", output);
            AssertConditionalParenthesesOperations(source, output);
        }

        [Test]
        public async Task StructuralConditionalStaticReceiverInnerCollectionInsideOuterBodyStillObserved()
        {
            var source = ConditionalStaticImplicitTypes + "class Clock{public string M(){foreach(var outer in new[]{1}){foreach(var inner in global::Factory.Create()){} }return Recorder.Text;}" + ConditionalParenthesesBranch + "}";
            var output = await Reduce(ConditionalStaticFactorySites(source));
            StringAssert.Contains("in global::Factory.Create()", output);
            AssertConditionalParenthesesOperations(source, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StructuralConditionalStaticReceiverSameFactoryInCollectionAndBodyHasOccurrencePermission(bool safeFirst)
        {
            const string safe = "var independent=global::Factory.Create();";
            var source = ConditionalStaticImplicitTypes + "class Clock{public string M(){" + (safeFirst ? safe : "") + "foreach(var value in global::Factory.Create()){var body=global::Factory.Create();}" + (!safeFirst ? safe : "") + "return Recorder.Text;}" + ConditionalParenthesesBranch + "}";
            var output = await Reduce(ConditionalStaticFactorySites(source));
            StringAssert.Contains("independent=Factory.Create()", output);
            StringAssert.Contains("in global::Factory.Create()", output);
            StringAssert.Contains("body=Factory.Create()", output);
            AssertConditionalParenthesesOperations(source, output);
        }

        [Test]
        public async Task StructuralConditionalStaticReceiverExplicitOuterCaptureObservesLoopBodyToo()
        {
            var source = ConditionalStaticImplicitTypes + "class Clock{static string Capture(Func<string> f,[CallerArgumentExpression(\"f\")]string text=null)=>text;public string M()=>Capture(()=>{foreach(var value in global::Factory.Create()){var body=global::Factory.Create();}return Recorder.Text;});" + ConditionalParenthesesBranch + "}";
            var output = await Reduce(ConditionalStaticFactorySites(source));
            StringAssert.Contains("body=global::Factory.Create()", output);
            AssertConditionalParenthesesOperations(source, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StructuralConditionalStaticReceiverUsingResourceKeepsUsefulCoverage(bool statement)
        {
            CodeModelGenerator.Instance.AddMetadataReference(MetadataReference.CreateFromFile(typeof(System.Text.Json.JsonDocument).Assembly.Location));
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System.Text.Json;class Clock{public int M(){");
                if (statement)
                {
                    writer.WriteLine($"using(var document={typeof(System.Text.Json.JsonDocument)}.Parse(\"{{}}\")){{return document.RootElement.GetRawText().Length;}}");
                }
                else
                {
                    writer.WriteLine($"using var document={typeof(System.Text.Json.JsonDocument)}.Parse(\"{{}}\");");
                    writer.WriteRawLine("return document.RootElement.GetRawText().Length;");
                }
                writer.WriteRawLine("}" + ConditionalParenthesesBranch + "}");
            });
            var output = await Reduce(code);
            StringAssert.Contains("document=JsonDocument.Parse", output);
            AssertConditionalParenthesesOperations(code.Content, output);
        }

        [Test]
        public async Task StructuralConditionalStaticReceiverOptionalDisposalCallerInfoIsNotResourceTextCapture()
        {
            const string types = "using System;using System.Runtime.CompilerServices;static class Recorder{public static int Line;public static string Text;}ref struct Resource{public void Dispose([CallerLineNumber]int line=0,[CallerArgumentExpression(\"line\")]string text=null){Recorder.Line=line;Recorder.Text=text;}}static class Factory{public static Resource Create()=>default;}";
            var source = types + "class Clock{public string M(){using(var resource=global::Factory.Create()){}return Recorder.Text;}" + ConditionalParenthesesBranch + "}";
            var output = await Reduce(ConditionalStaticFactorySites(source));
            StringAssert.Contains("resource=Factory.Create()", output);
            AssertConditionalParenthesesOperations(source, output);
            AssertBoundaryTriviaIdentity(source, output);
        }
    }
}
