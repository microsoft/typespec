// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis.Text;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        private const string ConditionalStaticImplicitTypes = "using System;using System.Runtime.CompilerServices;public class Collection{}public class Enumerator{bool moved;public int Current=>1;public bool MoveNext(){if(moved)return false;moved=true;return true;}}public static class Recorder{public static string Text;}public static class Extensions{public static Enumerator GetEnumerator(this Collection self,[CallerArgumentExpression(\"self\")]string text=null){Recorder.Text=text;return new Enumerator();}}public static class Factory{public static Collection Create()=>new Collection();}";

        [TestCase(false)]
        [TestCase(true)]
        public async Task StructuralConditionalStaticReceiverImplicitCollectionCaptureIsNotAnEmptyCallStack(bool bodyOccurrence)
        {
            var source = ConditionalStaticImplicitTypes + "public class Clock{public string M(){int result=0;foreach(var value in global::Factory.Create()){result=" + (bodyOccurrence ? "global::System.Math.Abs(value-3)" : "value") + ";}return Recorder.Text+\":\"+result;}" + ConditionalParenthesesBranch + "}";
            var factory = new CSharpType("Factory", "", false, false, null, Array.Empty<CSharpType>(), true, false);
            var site = new TypeReferenceSite(new TextSpan(source.IndexOf("global::Factory", StringComparison.Ordinal), "global::Factory".Length), factory);
            var sites = bodyOccurrence ? new[] { site, new TypeReferenceSite(new TextSpan(source.IndexOf("global::System.Math", StringComparison.Ordinal), "global::System.Math".Length), typeof(Math)) } : new[] { site };
            var output = await Reduce(new CodeFile(source, "Clock.cs", sites));
            StringAssert.Contains("foreach(var value in global::Factory.Create())", output,
                "Implicit GetEnumerator CAE observes the collection spelling");
            if (bodyOccurrence) StringAssert.Contains("result=Math.Abs(value-3)", output,
                "The loop body is not part of the observed collection expression");
            AssertConditionalParenthesesOperations(source, output);
        }
    }
}
