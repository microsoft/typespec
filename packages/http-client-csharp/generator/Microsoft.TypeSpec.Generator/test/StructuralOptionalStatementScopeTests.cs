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
        // SDK-shaped Optional call before the conditional additional-properties block.
        // Scenarios retain the original regression separately from scope/source negatives.
        [TestCase(0, true, TestName = "OptionalStatementScope_SdkSiblingBranch")]
        [TestCase(1, true, TestName = "OptionalStatementScope_NestedLaterShadowDoesNotEscape")]
        [TestCase(2, false, TestName = "OptionalStatementScope_OuterLaterShadow")]
        [TestCase(3, false, TestName = "OptionalStatementScope_OuterEarlierShadow")]
        [TestCase(4, false, TestName = "OptionalStatementScope_AffectedStatementVaries")]
        [TestCase(5, false, TestName = "OptionalStatementScope_CallerSourceCapture")]
        [TestCase(6, false, TestName = "OptionalStatementScope_UnrecordedReceiver")]
        [TestCase(7, false, TestName = "OptionalStatementScope_ForeignNamespaceImport")]
        [TestCase(8, false, TestName = "OptionalStatementScope_OtherMethodNotAuthorized")]
        public async Task OptionalStatementScopeTrial(int scenario, bool shorten)
        {
            var ns = scenario == 7 ? "Foreign" : "Sample";
            var target = new CSharpType("Optional", ns, false, false, null, Array.Empty<CSharpType>(), true, false);
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System; using System.Runtime.CompilerServices;");
                if (scenario == 7)
                {
                    writer.WriteRawLine("using Foreign;");
                }

                writer.WriteRawLine($"namespace {ns} {{ internal static class Optional {{ public static bool IsDefined(object value) => value != null; public static bool Other(object value) => value != null; }} }}");
                writer.WriteRawLine("namespace Sample { public class Probe { public object Properties { get; set; } public int Sink { get; set; }");
                writer.WriteRawLine("static bool Capture(bool value, [CallerArgumentExpression(\"value\")] string text = null) => value;");
                writer.WriteRawLine("public void Write() {");
                if (scenario == 3)
                {
                    writer.WriteRawLine("#if NET6_0_OR_GREATER\nobject Optional = null;\n#endif");
                }

                if (scenario == 5)
                {
                    writer.WriteLine($"if (Capture({target}.IsDefined(Properties)))");
                }
                else if (scenario == 8)
                {
                    writer.WriteLine($"if ({target}.Other(Properties))");
                }
                else
                {
                    writer.WriteLine($"if ({target}.IsDefined(Properties))");
                }

                writer.WriteRawLine(scenario == 4 ? "{\n#if NET6_0_OR_GREATER\nSink = 6;\n#else\nSink = 0;\n#endif\n}" : "{ Sink = 1; }");
                writer.WriteRawLine("if (Properties != null) { foreach (var item in new[] { 1 }) {");
                writer.WriteRawLine("#if NET6_0_OR_GREATER\nSink = item;\n#else\nusing (var document = new System.IO.MemoryStream()) { Sink = (int)document.Length; }\n#endif");
                if (scenario == 1)
                {
                    writer.WriteRawLine("#if NET8_0_OR_GREATER\nobject Optional = null;\n#endif");
                }

                writer.WriteRawLine("} }");
                if (scenario == 2)
                {
                    writer.WriteRawLine("#if NET6_0_OR_GREATER\nobject Optional = null;\n#endif");
                }

                writer.WriteRawLine("} } }");
            });
            if (scenario == 6)
            {
                code = new CodeFile(code.Content, code.Name);
            }

            var output = await Reduce(code);
            // Existing operation oracle covers every supported configuration, including
            // constructed calls/conversions and captured caller-argument constants.
            AssertConditionalParenthesesOperations(code.Content, output);
            StringAssert.Contains(shorten ? "if (Optional.IsDefined(Properties))" : $"global::{ns}.Optional.", output);
        }
    }
}
