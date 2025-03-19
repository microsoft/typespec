using System;
using System.Collections.Generic;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Utilities
{
    public class FormattableStringHelpersTests
    {
        [TestCaseSource(nameof(TestBuildBreakLines))]
        public void TestBreakLines(FormattableString input, List<FormattableString> expected)
        {
            var result = FormattableStringHelpers.BreakLines(input);
            Assert.AreEqual(expected.Count, result.Count);
            // format in the line we have is the same as expected
            for (int i = 0; i < result.Count; i++)
            {
                Assert.AreEqual(result[i].Format, expected[i].Format);
                Assert.AreEqual(result[i].ArgumentCount, expected[i].ArgumentCount);
                CollectionAssert.AreEqual(result[i].GetArguments(), expected[i].GetArguments());
            }
        }

        public static IEnumerable<TestCaseData> TestBuildBreakLines
        {
            get
            {
                yield return new TestCaseData(
                    (FormattableString)$"\n\n\n\n",
                    new List<FormattableString>
                    {
                        $"", $"", $"", $"", $"" // four line breaks should produce 5 lines.
                    })
                    .SetName("TestBreakLines_AllLineBreaks");

                yield return new TestCaseData(
                    (FormattableString)$"A timestamp indicating the last modified time\nclient. The operation will be performed only\nbeen modified since the specified time.",
                    new List<FormattableString> {
                        $"A timestamp indicating the last modified time",
                        $"client. The operation will be performed only",
                        $"been modified since the specified time."
                    }).SetName("TestBreakLines_AllLiteralsNoArgs");

                yield return new TestCaseData(
                    (FormattableString)$"A timestamp indicating \rthe last modified time\nclient. The operation will be performed only\nbeen modified since the specified time.",
                    new List<FormattableString> {
                        $"A timestamp indicating \rthe last modified time",
                        $"client. The operation will be performed only",
                        $"been modified since the specified time."
                    }).SetName("TestBreakLines_AllLiteralsNoArgsWithCR");

                yield return new TestCaseData(
                    (FormattableString)$"A timestamp indicating the last modified time\r\nclient. The operation will be performed only\r\nbeen modified since the specified time.",
                    new List<FormattableString> {
                        $"A timestamp indicating the last modified time",
                        $"client. The operation will be performed only",
                        $"been modified since the specified time."
                    }).SetName("TestBreakLines_AllLiteralsNoArgsWithCRLF");

                yield return new TestCaseData(
                    (FormattableString)$"A timestamp indicating the last modified time\r\nclient. The operation will be performed only\nbeen modified since the specified time.",
                    new List<FormattableString> {
                        $"A timestamp indicating the last modified time",
                        $"client. The operation will be performed only",
                        $"been modified since the specified time."
                    }).SetName("TestBreakLines_AllLiteralsNoArgsWithMixedCRLF");

                yield return new TestCaseData(
                    (FormattableString)$"{"A timestamp indicating the last modified time\nclient. The operation will be performed only\nbeen modified since the specified time."}",
                    new List<FormattableString> {
                        $"{"A timestamp indicating the last modified time"}",
                        $"{"client. The operation will be performed only"}",
                        $"{"been modified since the specified time."}"
                    }).SetName("TestBreakLines_OneArgOnly");

                yield return new TestCaseData(
                    (FormattableString)$"{"A timestamp indicating \rthe last modified time\nclient. The operation will be performed only\nbeen modified since the specified time."}",
                    new List<FormattableString> {
                        $"{"A timestamp indicating \rthe last modified time"}",
                        $"{"client. The operation will be performed only"}",
                        $"{"been modified since the specified time."}"
                    }).SetName("TestBreakLines_OneArgOnlyWithCR");

                yield return new TestCaseData(
                    (FormattableString)$"{"A timestamp indicating \rthe last modified time\r\r\r\nclient. The operation will be performed only\nbeen modified since the specified time."}",
                    new List<FormattableString> {
                        $"{"A timestamp indicating \rthe last modified time\r\r"}",
                        $"{"client. The operation will be performed only"}",
                        $"{"been modified since the specified time."}"
                    }).SetName("TestBreakLines_OneArgOnlyWithMultipleCRs");

                yield return new TestCaseData(
                    (FormattableString)$"{"A timestamp indicating the last modified time\r\nclient. The operation will be performed only\r\nbeen modified since the specified time."}",
                    new List<FormattableString> {
                        $"{"A timestamp indicating the last modified time"}",
                        $"{"client. The operation will be performed only"}",
                        $"{"been modified since the specified time."}"
                    }).SetName("TestBreakLines_OneArgOnlyWithCRLF");

                yield return new TestCaseData(
                    (FormattableString)$"{"A timestamp indicating the last modified time\r\nclient. The operation will be performed only\nbeen modified since the specified time."}",
                    new List<FormattableString> {
                        $"{"A timestamp indicating the last modified time"}",
                        $"{"client. The operation will be performed only"}",
                        $"{"been modified since the specified time."}"
                    }).SetName("TestBreakLines_OneArgOnlyWithMixedCRLF");

                yield return new TestCaseData(
                    (FormattableString)$"first{"x"}second\nthird{"y"}",
                    new List<FormattableString> {
                        $"first{"x"}second",
                        $"third{"y"}"
                    }).SetName("TestBreakLines_LineBreaksInFormat");

                yield return new TestCaseData(
                    (FormattableString)$"first{"x\nz"}second\nthird{"y"}",
                    new List<FormattableString> {
                        $"first{"x"}",
                        $"{"z"}second",
                        $"third{"y"}"
                    }).SetName("TestBreakLines_LineBreakInArgument");

                yield return new TestCaseData(
                    (FormattableString)$"first{"x"}second\nthird{"y\n"}",
                    new List<FormattableString> {
                        $"first{"x"}second",
                        $"third{"y"}",
                        $"{""}"
                    }).SetName("TestBreakLines_LineBreaksAtEndOfArgument");

                yield return new TestCaseData(
                    (FormattableString)$"first{"x"}second\nthird{null}",
                    new List<FormattableString> {
                        $"first{"x"}second",
                        $"third{null}"
                    }).SetName("TestBreakLines_NullArgument");

                yield return new TestCaseData(
                    (FormattableString)$"first{"x":L}second\nthird{null}",
                    new List<FormattableString> {
                        $"first{"x":L}second",
                        $"third{null}"
                    }).SetName("TestBreakLines_TrivialFormatSpecifier");

                yield return new TestCaseData(
                    (FormattableString)$"first{{",
                    new List<FormattableString> {
                        $"first{{"
                    }).SetName("TestBreakLines_LiteralOpenBrace");

                yield return new TestCaseData(
                    (FormattableString)$"first}}",
                    new List<FormattableString> {
                        $"first}}"
                    }).SetName("TestBreakLines_LiteralCloseBrace");

                yield return new TestCaseData(
                    (FormattableString)$"first{{}}",
                    new List<FormattableString> {
                        $"first{{}}"
                    }).SetName("TestBreakLines_LiteralOpenAndCloseBrace");

                yield return new TestCaseData(
                    (FormattableString)$"first{{T}}",
                    new List<FormattableString> {
                        $"first{{T}}"
                    }).SetName("TestBreakLines_LiteralOpenAndCloseBraceWithT");

                yield return new TestCaseData(
                    (FormattableString)$"first {"name"}: {{T}}, last {"name"}: {{U}}",
                    new List<FormattableString> {
                        $"first {"name"}: {{T}}, last {"name"}: {{U}}"
                    }).SetName("TestBreakLines_LiteralOpenAndCloseBraceWithArgs");

                yield return new TestCaseData(
                    (FormattableString)$"first{{\n}}",
                    new List<FormattableString> {
                        $"first{{",
                        $"}}"
                    }).SetName("TestBreakLines_LiteralOpenAndCloseBraceWithLineBreaks");

                yield return new TestCaseData(
                    (FormattableString)$"first{{T\n}}",
                    new List<FormattableString> {
                        $"first{{T",
                        $"}}"
                    }).SetName("TestBreakLines_LiteralOpenAndCloseBraceWithLineBreaksAndT");

                yield return new TestCaseData(
                    (FormattableString)$"first{{T{"name"}\n}}",
                    new List<FormattableString> {
                        $"first{{T{"name"}",
                        $"}}"
                    }).SetName("TestBreakLines_LiteralOpenAndCloseBraceWithLineBreaksAndArgs");

                yield return new TestCaseData(
                    (FormattableString)$"first{{T{"last\nname"}\n}}",
                    new List<FormattableString> {
                        $"first{{T{"last"}",
                        $"{"name"}",
                        $"}}"
                    }).SetName("TestBreakLines_LiteralOpenAndCloseBraceWithLineBreaksAndArgsContainingLineBreaks");

                FormattableString inner = $"{"x"}\n{"y"}z";
                FormattableString outter = $"first{inner}Second\nthird{null}";
                yield return new TestCaseData(
                    outter,
                    new List<FormattableString> {
                        $"first{"x"}",
                        $"{"y"}zSecond",
                        $"third{null}"
                    }).SetName("TestBreakLines_RecursiveFormattableStrings");

                inner = $"\n\n\n\n";
                outter = $"first{inner}second\nthird{null}";
                yield return new TestCaseData(
                    outter,
                    new List<FormattableString> {
                        $"first",
                        $"",
                        $"",
                        $"",
                        $"second",
                        $"third{null}"
                    }).SetName("TestBreakLines_RecursiveFormattableStringsWithAllLineBreaks");

                yield return new TestCaseData(
                    (FormattableString)$"first\n\n\n\nsecond\nthird{null}",
                    new List<FormattableString> {
                        $"first",
                        $"",
                        $"",
                        $"",
                        $"second",
                        $"third{null}"
                    }).SetName("TestBreakLines_MultipleLineBreaks");

                // current solution of format specifier in argument is that we ignore them during the process of line breaking.
                yield return new TestCaseData(
                    (FormattableString)$"first{"x\ny":L}second\nthird{null}",
                    new List<FormattableString> {
                        $"first{"x\ny":L}second",
                        $"third{null}"
                    }).SetName("TestBreakLines_FormatSpecifierInArg");
            }
        }
    }
}
