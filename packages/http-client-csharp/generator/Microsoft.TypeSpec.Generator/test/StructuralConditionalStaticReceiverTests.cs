// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        [TestCase(0, "Math.Abs(value)")]
        [TestCase(1, "DateTimeOffset.UtcNow")]
        [TestCase(2, "TimeSpan.Zero")]
        public async Task StructuralConditionalStaticReceiverStableUnitUsesOccurrenceProof(int kind, string expected)
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System;class Clock{");
                if (kind == 0) writer.WriteLine($"public int M(int value)=>{typeof(Math)}.Abs(value);");
                if (kind == 1) writer.WriteLine($"public DateTimeOffset M()=>{typeof(DateTimeOffset)}.UtcNow;");
                if (kind == 2) writer.WriteLine($"public TimeSpan M()=>{typeof(TimeSpan)}.Zero;");
                writer.WriteRawLine(ConditionalParenthesesBranch);
                writer.WriteRawLine("}");
            });
            var output = await Reduce(code);
            StringAssert.Contains(expected, output);
            StringAssert.DoesNotContain("global::", output);
            AssertStaticMemberBindings(code.Content, output);
            AssertConditionalParenthesesOperations(code.Content, output);
        }

        [Test]
        public async Task StructuralConditionalStaticReceiverVariantLocalShadowCannotUseOriginalConfigurationOnly()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System;class Shadow{public int Abs(int value)=>-value;}class Clock{public int M(int value){\n#if NET8_0_OR_GREATER\nvar Math=new Shadow();\n#endif");
                writer.WriteLine($"return {typeof(Math)}.Abs(value);");
                writer.WriteRawLine("}}");
            });
            var output = await Reduce(code);
            StringAssert.DoesNotContain("return Math.Abs(value)", output);
            AssertConditionalParenthesesOperations(code.Content, output);
        }

        [Test]
        public async Task StructuralConditionalStaticReceiverOuterCapturedLambdaKeepsOriginalSpelling()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System;class Clock{static string Capture(Func<int> f,[System.Runtime.CompilerServices.CallerArgumentExpression(\"f\")]string text=null)=>text;");
                writer.WriteLine($"public string M(int value)=>Capture(()=>{typeof(Math)}.Abs(value));");
                writer.WriteRawLine(ConditionalParenthesesBranch);
                writer.WriteRawLine("}");
            });
            var output = await Reduce(code);
            StringAssert.Contains("global::System.Math.Abs(value)", output);
            AssertConditionalParenthesesOperations(code.Content, output);
        }

        [Test]
        public async Task StructuralConditionalStaticReceiverHiddenPrefixRemainsUnchanged()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System;class Clock{\n#line hidden");
                writer.WriteLine($"public TimeSpan M()=>{typeof(TimeSpan)}.Zero;");
                writer.WriteRawLine("#line default");
                writer.WriteRawLine(ConditionalParenthesesBranch);
                writer.WriteRawLine("}");
            });
            var output = await Reduce(code);
            StringAssert.Contains("global::System.TimeSpan.Zero", output);
            AssertConditionalParenthesesOperations(code.Content, output);
        }

        [Test]
        public async Task StructuralConditionalStaticReceiverUnrecordedNameDoesNotAcquirePermission()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System;class Clock{");
                writer.WriteLine($"public TimeSpan M()=>{typeof(TimeSpan)}.Zero;");
                writer.WriteRawLine(ConditionalParenthesesBranch);
                writer.WriteRawLine("}");
            });
            var output = await Reduce(new CodeFile(code.Content, code.Name));
            StringAssert.Contains("global::System.TimeSpan.Zero", output);
            AssertConditionalParenthesesOperations(code.Content, output);
        }
    }
}
