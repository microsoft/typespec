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
                    (FormattableString)$"A timestamp indicating the last modified time\nclient. The operation will be performed only\nbeen modified since the specified time.",
                    new List<FormattableString> {
                        $"A timestamp indicating the last modified time",
                        $"client. The operation will be performed only",
                        $"been modified since the specified time."
                    }).SetName("TestBreakLines_AllLiteralsNoArgs");

                yield return new TestCaseData(
                    (FormattableString)$"{"A timestamp indicating the last modified time\nclient. The operation will be performed only\nbeen modified since the specified time."}",
                    new List<FormattableString> {
                        $"{"A timestamp indicating the last modified time"}",
                        $"{"client. The operation will be performed only"}",
                        $"{"been modified since the specified time."}"
                    }).SetName("TestBreakLines_OneArgOnly");

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
                        $"first{{", $"}}"
                    }).SetName("TestBreakLines_LiteralOpenAndCloseBraceWithLineBreaks");

                yield return new TestCaseData(
                    (FormattableString)$"first{{T\n}}",
                    new List<FormattableString> {
                        $"first{{T", $"}}"
                    }).SetName("TestBreakLines_LiteralOpenAndCloseBraceWithLineBreaksAndT");

                yield return new TestCaseData(
                    (FormattableString)$"first{{T{"name"}\n}}",
                    new List<FormattableString> {
                        $"first{{T{"name"}", $"}}"
                    }).SetName("TestBreakLines_LiteralOpenAndCloseBraceWithLineBreaksAndArgs");

                yield return new TestCaseData(
                    (FormattableString)$"first{{T{"last\nname"}\n}}",
                    new List<FormattableString> {
                        $"first{{T{"last"}",
                        $"{"name"}", $"}}"
                    }).SetName("TestBreakLines_LiteralOpenAndCloseBraceWithLineBreaksAndArgsContainingLineBreaks");

                FormattableString inner = $"{"x"}\n{"y"}";
                FormattableString outter = $"first{inner}second\nthird{null}";
                yield return new TestCaseData(
                    outter,
                    new List<FormattableString> {
                        $"first{"x"}",
                        $"{"y"}second",
                        $"third{null}"
                    }).SetName("TestBreakLines_RecursiveFormattableStrings");

                // TODO: Check if this is valid after we update logic in FormattableStringHelpers to handle FormatSpecifier and \n in one argument
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
