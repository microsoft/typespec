// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        [TestCase("public int M(int value)=>((int)value);", "=> (int)value;")]
        [TestCase("public int M(int value){return (((int)value));}", "return (int)value;")]
        [TestCase("public int M(int value)=>Echo(((int)value));private int Echo(int value)=>value;", "Echo((int)value)")]
        [TestCase("public long M(int value){var result=((long)value);return result;}", "result=(long)value;")]
        [TestCase("public long M(int value,int other)=>((long)value)+other;", "=>(long)value+other;")]
        [TestCase("public object M()=>((global::System.Exception)null);", "=>(global::System.Exception)null;")]
        [TestCase("public object M()=>((global::System.DateTimeOffset)default);", "=>(global::System.DateTimeOffset)default;")]
        [TestCase("public object M(int value)=>((global::Fixtures.Number)value);", "=>(global::Fixtures.Number)value;")]
        public async Task StructuralParenthesesGrammarOuterCastGroupingPreservesConversion(string member, string expected)
        {
            // No writer-name provenance: this candidate is parentheses-only and
            // must not resurrect deferred C3 type-name qualification changes.
            const string number = "namespace Fixtures{public struct Number{public static explicit operator Number(int value)=>default;}}";
            var source = number + "class Clock{" + member + "}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            // The input arrow's spacing is preserved; only removed tokens change.
            StringAssert.Contains(expected.Replace("=> ", "=>"), output);
            AssertParenthesesOperations(source, output);
            AssertBoundaryTriviaIdentity(source, output);
        }

        [TestCase("public object M(int value)=>(global::Fixtures.Number)(+value);", "(global::Fixtures.Number)(+value)")]
        [TestCase("public int M(object value)=>((global::System.Exception)value).HResult;", "((global::System.Exception)value).HResult")]
        [TestCase("public long M(int value)=>-((long)value);", "-((long)value)")]
        [TestCase("public int M(int value=((int)0))=>value;", "value=((int)0)")]
        [TestCase("public string M(int value)=>Capture(()=>{return((int)value);});static string Capture(System.Func<int> f,[System.Runtime.CompilerServices.CallerArgumentExpression(\"f\")]string text=null)=>text;", "return((int)value)")]
        public async Task StructuralParenthesesGrammarCastBarriersAndSourceObservationRemain(string member, string expected)
        {
            const string number = "namespace Fixtures{public struct Number{public static explicit operator Number(int value)=>default;}}";
            var source = number + "class Clock{" + member + "}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains(expected, output);
            AssertParenthesesOperations(source, output);
            AssertBoundaryTriviaIdentity(source, output);
        }
    }
}
