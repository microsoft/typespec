using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp.Input;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Utilities
{
    public class FormattableStringHelpersTests
    {
        //TODO: refactor into the second test
        [TestCase("A timestamp indicating the last modified time\nclient. The operation will be performed only\nbeen modified since the specified time.", new string[] { "A timestamp indicating the last modified time", "client. The operation will be performed only", "been modified since the specified time." })]
        public void TestBreakLinesWithLiteralsNoArgs(string inputFormat, string[] expected)
        {
            var fs = FormattableStringFactory.Create(inputFormat);
            var result = FormattableStringHelpers.BreakLines(fs);
            Assert.AreEqual(expected.Length, result.Count);
            // format in the line we have is the same as expected
            // validate that they do not have args
            foreach (var (format, argumentCount, expectedFormat) in result.Zip(expected, (a, e) => (a.Format, a.ArgumentCount, e)))
            {
                Assert.IsTrue(format == expectedFormat);
                Assert.IsTrue(argumentCount == 0);
            }
        }

        public static IEnumerable<TestCaseData> TestBuildBreakLines
        {
            get
            {
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
                new List<FormattableString> { $"first{"x"}second", $"third{null}"});

                // Case for format specifier trivial
                yield return new TestCaseData(
                (FormattableString)$"first{"x":L}second\nthird{null}",
                new List<FormattableString> { $"first{"x":L}second", $"third{null}" });

                // TODO: Check if this is valid after we update logic in FormattableStringHelpers to handle FormatSpecifier and \n in one argument
                // Case for format specifier
                yield return new TestCaseData(
                (FormattableString)$"first{"x\ny":L}second\nthird{null}",
                new List<FormattableString> { $"first{"x\ny":L}second", $"third{null}" });
            }
        }

        [TestCaseSource(nameof(TestBuildBreakLines))]
        public void TestBreakLinesNoLiteralsWithOneArg(FormattableString input, List<FormattableString> expected)
        {
            var result = FormattableStringHelpers.BreakLines(input);
            Assert.AreEqual(expected.Count, result.Count);
            // format in the line we have is the same as expected
            for (int i = 0; i < result.Count; i++) {
                Assert.IsTrue(result[i].Format == expected[i].Format);
                Assert.IsTrue(result[i].ArgumentCount == expected[i].ArgumentCount);
                CollectionAssert.AreEqual(result[i].GetArguments(), expected[i].GetArguments());
            }
        }
    }
}
