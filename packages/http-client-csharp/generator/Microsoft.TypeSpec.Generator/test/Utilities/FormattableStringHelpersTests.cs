using System;
using System.Collections.Generic;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Utilities
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
                        $"A timestamp indicating ",
                        $"the last modified time",
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
                        $"{"A timestamp indicating "}",
                        $"{"the last modified time"}",
                        $"{"client. The operation will be performed only"}",
                        $"{"been modified since the specified time."}"
                    }).SetName("TestBreakLines_OneArgOnlyWithCR");

                yield return new TestCaseData(
                    (FormattableString)$"{"A timestamp indicating \rthe last modified time\r\r\r\nclient. The operation will be performed only\nbeen modified since the specified time."}",
                    new List<FormattableString> {
                        $"{"A timestamp indicating "}",
                        $"{"the last modified time"}",
                        $"{""}",
                        $"{""}",
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
                    (FormattableString)$"first{"":L}second",
                    new List<FormattableString> {
                        $"first{"":L}second"
                    }).SetName("TestBreakLines_EmptyFormattedString");

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
                FormattableString outer = $"first{inner}Second\nthird{null}";
                yield return new TestCaseData(
                    outer,
                    new List<FormattableString> {
                        $"first{"x"}",
                        $"{"y"}zSecond",
                        $"third{null}"
                    }).SetName("TestBreakLines_RecursiveFormattableStrings");

                inner = $"\n\n\n\n";
                outer = $"first{inner}second\nthird{null}";
                yield return new TestCaseData(
                    outer,
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

                // formatted arguments (e.g. ":L") are rendered through a custom formatter that safely escapes any
                // embedded line terminators, so they are left intact and are not split during line breaking.
                yield return new TestCaseData(
                    (FormattableString)$"first{"x\ny":L}second\nthird{null}",
                    new List<FormattableString> {
                        $"first{"x\ny":L}second",
                        $"third{null}"
                    }).SetName("TestBreakLines_FormatSpecifierInArg");

                yield return new TestCaseData(
                    (FormattableString)$"first\u0085second\u0085third",
                    new List<FormattableString> {
                        $"first",
                        $"second",
                        $"third"
                    }).SetName("TestBreakLines_AllLiteralsNoArgsWithNextLine");

                yield return new TestCaseData(
                    (FormattableString)$"first\u2028second\u2028third",
                    new List<FormattableString> {
                        $"first",
                        $"second",
                        $"third"
                    }).SetName("TestBreakLines_AllLiteralsNoArgsWithLineSeparator");

                yield return new TestCaseData(
                    (FormattableString)$"first\u2029second\u2029third",
                    new List<FormattableString> {
                        $"first",
                        $"second",
                        $"third"
                    }).SetName("TestBreakLines_AllLiteralsNoArgsWithParagraphSeparator");

                yield return new TestCaseData(
                    (FormattableString)$"first\rsecond\r\nthird\u0085fourth\u2028fifth\u2029sixth\nseventh",
                    new List<FormattableString> {
                        $"first",
                        $"second",
                        $"third",
                        $"fourth",
                        $"fifth",
                        $"sixth",
                        $"seventh"
                    }).SetName("TestBreakLines_AllLiteralsNoArgsWithAllTerminators");

                yield return new TestCaseData(
                    (FormattableString)$"{"first\rsecond\r\nthird\u0085fourth\u2028fifth\u2029sixth\nseventh"}",
                    new List<FormattableString> {
                        $"{"first"}",
                        $"{"second"}",
                        $"{"third"}",
                        $"{"fourth"}",
                        $"{"fifth"}",
                        $"{"sixth"}",
                        $"{"seventh"}"
                    }).SetName("TestBreakLines_OneArgOnlyWithAllTerminators");

                yield return new TestCaseData(
                    (FormattableString)$"first\r\u0085\u2028\u2029second",
                    new List<FormattableString> {
                        $"first",
                        $"",
                        $"",
                        $"",
                        $"second"
                    }).SetName("TestBreakLines_ConsecutiveMixedTerminators");

                yield return new TestCaseData(
                    (FormattableString)$"first\u2028",
                    new List<FormattableString> {
                        $"first",
                        $""
                    }).SetName("TestBreakLines_LiteralEndingWithLineSeparator");

                yield return new TestCaseData(
                    (FormattableString)$"first{"x"}second\u0085third{"y\u2029"}",
                    new List<FormattableString> {
                        $"first{"x"}second",
                        $"third{"y"}",
                        $"{""}"
                    }).SetName("TestBreakLines_TerminatorsAtEndOfArgument");

                inner = $"{"x"}\u0085{"y"}z";
                outer = $"first{inner}Second\u2029third{null}";
                yield return new TestCaseData(
                    outer,
                    new List<FormattableString> {
                        $"first{"x"}",
                        $"{"y"}zSecond",
                        $"third{null}"
                    }).SetName("TestBreakLines_RecursiveFormattableStringsWithAllTerminators");

                inner = $"{"x"}\u2028";
                outer = $"first{inner}";
                yield return new TestCaseData(
                    outer,
                    new List<FormattableString> {
                        $"first{"x"}",
                        $""
                    }).SetName("TestBreakLines_RecursiveFormattableStringEndingWithTerminator");

                // a terminator embedded in a formatted (":L") argument is left intact - only unformatted literal text
                // around it (here the trailing \u0085) causes a line break.
                yield return new TestCaseData(
                    (FormattableString)$"first{"x\u2028y":L}second\u0085third{null}",
                    new List<FormattableString> {
                        $"first{"x\u2028y":L}second",
                        $"third{null}"
                    }).SetName("TestBreakLines_FormatSpecifierInArgWithTerminators");

                // a literal ending in a lone '\r' followed by a string argument starting with '\n' is a single
                // CRLF split across the interpolation boundary and must produce one line break, not two.
                yield return new TestCaseData(
                    (FormattableString)$"first\r{"\nsecond"}",
                    new List<FormattableString> {
                        $"first",
                        $"{"second"}"
                    }).SetName("TestBreakLines_CRLFAcrossLiteralAndArgumentBoundary");

                // same as above but the '\r' half is the string argument and the '\n' half starts the following literal.
                // BreakLinesCoreForString always wraps the text following the last '\n' in an argument placeholder
                // (even when empty), so the merged line keeps that placeholder ahead of the literal text.
                yield return new TestCaseData(
                    (FormattableString)$"{"first\r"}\nsecond",
                    new List<FormattableString> {
                        $"{"first"}",
                        $"{""}second"
                    }).SetName("TestBreakLines_CRLFAcrossArgumentAndLiteralBoundary");

                inner = $"{"x"}\r";
                outer = $"first{inner}\nsecond";
                yield return new TestCaseData(
                    outer,
                    new List<FormattableString> {
                        $"first{"x"}",
                        $"second"
                    }).SetName("TestBreakLines_CRLFAcrossNestedFormattableStringBoundary");

                // an empty string argument emits nothing, so it must not break up a CRLF pair that spans it.
                yield return new TestCaseData(
                    (FormattableString)$"first\r{""}\nsecond",
                    new List<FormattableString> {
                        $"first",
                        $"second"
                    }).SetName("TestBreakLines_CRLFAcrossEmptyArgument");
            }
        }
    }
}
