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
                // Case for all literals no args
                yield return new TestCaseData(
                    (FormattableString)$"A timestamp indicating the last modified time\nclient. The operation will be performed only\nbeen modified since the specified time.",
                    new List<FormattableString> {
                        $"A timestamp indicating the last modified time",
                        $"client. The operation will be performed only",
                        $"been modified since the specified time."
                    });

                yield return new TestCaseData(
                    (FormattableString)$"{"A timestamp indicating the last modified time\nclient. The operation will be performed only\nbeen modified since the specified time."}",
                    new List<FormattableString> { $"{"A timestamp indicating the last modified time"}", $"{"client. The operation will be performed only"}", $"{"been modified since the specified time."}" });

                // Case for FormattableString in arg
                yield return new TestCaseData(
                    (FormattableString)$"first{"x"}second\nthird{"y"}",
                    new List<FormattableString> { $"first{"x"}second", $"third{"y"}" });

                // Case for \n in argument
                yield return new TestCaseData(
                    (FormattableString)$"first{"x\nz"}second\nthird{"y"}",
                    new List<FormattableString> { $"first{"x"}", $"{"z"}second", $"third{"y"}" });

                // Case for \n at end of argument
                yield return new TestCaseData(
                    (FormattableString)$"first{"x"}second\nthird{"y\n"}",
                    new List<FormattableString> { $"first{"x"}second", $"third{"y"}", $"{""}" });

                // Case for null argument
                yield return new TestCaseData(
                    (FormattableString)$"first{"x"}second\nthird{null}",
                    new List<FormattableString> { $"first{"x"}second", $"third{null}" });

                // Case for format specifier trivial
                yield return new TestCaseData(
                    (FormattableString)$"first{"x":L}second\nthird{null}",
                    new List<FormattableString> { $"first{"x":L}second", $"third{null}" });

                // Case when the formattable string has {
                yield return new TestCaseData(
                    (FormattableString)$"first{{",
                    new List<FormattableString> { $"first{{" });

                // Case when the formattable string has }
                yield return new TestCaseData(
                    (FormattableString)$"first}}",
                    new List<FormattableString> { $"first}}" });

                // Case when the formattable string has { and }
                yield return new TestCaseData(
                    (FormattableString)$"first{{}}",
                    new List<FormattableString> { $"first{{}}" });

                // Case when the formattable string has { and }
                yield return new TestCaseData(
                    (FormattableString)$"first{{T}}",
                    new List<FormattableString> { $"first{{T}}" });

                // Case when the formattable string has { and }, and with arguments
                yield return new TestCaseData(
                    (FormattableString)$"first {"name"}: {{T}}, last {"name"}: {{U}}",
                    new List<FormattableString> { $"first {"name"}: {{T}}, last {"name"}: {{U}}" });

                // Case when the formattable string has { and } and line breaks
                yield return new TestCaseData(
                    (FormattableString)$"first{{\n}}",
                    new List<FormattableString> { $"first{{", $"}}" });

                // Case when the formattable string has { and } and line breaks
                yield return new TestCaseData(
                    (FormattableString)$"first{{T\n}}",
                    new List<FormattableString> { $"first{{T", $"}}" });

                // Case when the formattable string has { and } and line breaks and with arguments
                yield return new TestCaseData(
                    (FormattableString)$"first{{T{"name"}\n}}",
                    new List<FormattableString> { $"first{{T{"name"}", $"}}" });

                // Case when the formattable string has { and } and line breaks and with arguments which contains line breaks
                yield return new TestCaseData(
                    (FormattableString)$"first{{T{"last\nname"}\n}}",
                    new List<FormattableString> { $"first{{T{"last"}", $"{"name"}", $"}}" });

                // TODO: Check if this is valid after we update logic in FormattableStringHelpers to handle FormatSpecifier and \n in one argument
                // Case for format specifier
                yield return new TestCaseData(
                    (FormattableString)$"first{"x\ny":L}second\nthird{null}",
                    new List<FormattableString> { $"first{"x\ny":L}second", $"third{null}" });
            }
        }
    }
}
