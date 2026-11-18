// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        [Test]
        public async Task StructuralParenthesesGrammarHiddenCastGroupRetainsEveryDelimiter()
        {
            const string source = "class Clock{public int M(int value){\n#line hidden\nreturn (((int)value));\n#line default\n}}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains("return (((int)value));", output);
            AssertParenthesesOperations(source, output);
            AssertBoundaryTriviaIdentity(source, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task StructuralParenthesesGrammarCastVisibilityIsPerOccurrenceAndOrderIndependent(bool hiddenFirst)
        {
            var source = "class Clock{public long M(int value){\n" + (hiddenFirst ? "#line hidden" : "#line default") +
                "\nlong first=(((long)value));\n" + (hiddenFirst ? "#line default" : "#line hidden") +
                "\nlong second=(((long)value));\n#line default\nreturn first+second;}}";
            var output = await Reduce(new CodeFile(source, "Clock.cs"));
            StringAssert.Contains(hiddenFirst ? "first=(((long)value))" : "first=(long)value", output);
            StringAssert.Contains(hiddenFirst ? "second=(long)value" : "second=(((long)value))", output);
            AssertParenthesesOperations(source, output);
            AssertBoundaryTriviaIdentity(source, output);
        }
    }
}
