// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class CodeWriterTests
    {
        [Test]
        public void GeneratesNewNamesInChildScope()
        {
            var codeWriter = new CodeWriter();
            var cwd1 = new CodeWriterDeclaration("a");
            var cwd2 = new CodeWriterDeclaration("a");
            codeWriter.Line($"{cwd1:D}");
            using (codeWriter.Scope())
            {
                codeWriter.Line($"{cwd2:D}");
            }

            Assert.AreEqual(
                @"a
{
a0
}
", codeWriter.ToString(false));
        }

        [Test]
        public void ScopeLineIsInsideScope()
        {
            var codeWriter = new CodeWriter();
            var cwd1 = new CodeWriterDeclaration("a");
            var cwd2 = new CodeWriterDeclaration("a");
            using (codeWriter.Scope($"{cwd1:D}"))
            {
            }

            using (codeWriter.Scope($"{cwd2:D}"))
            {
            }

            Assert.AreEqual(
                @"a
{
}
a
{
}
", codeWriter.ToString(false));
        }

        [Test]
        public void VariableNameNotReusedWhenUsedInChildScope()
        {
            var codeWriter = new CodeWriter();
            var cwd1 = new CodeWriterDeclaration("a");
            var cwd2 = new CodeWriterDeclaration("a");
            using (codeWriter.Scope())
            {
                codeWriter.Line($"{cwd1:D}");
            }

            codeWriter.Line($"{cwd2:D}");

            Assert.AreEqual(
                @"{
a
}
a0
", codeWriter.ToString(false));
        }

        [Test]
        public void CorrectlyHandlesCurlyBraces()
        {
            var codeWriter = new CodeWriter();
            codeWriter.Append($"public {typeof(string)} Data {{ get; private set; }}");
            Assert.AreEqual("public string Data { get; private set; }" + Environment.NewLine,
                codeWriter.ToString(false));
        }

        [Test]
        public void FormatInFormat()
        {
            var codeWriter = new CodeWriter();
            FormattableString fs1 = $"'1' is {typeof(int)}";
            FormattableString fs2 = $"'a' is {typeof(char)} and {fs1} and 'true' is {typeof(bool)}";

            codeWriter.Append(fs2);
            var expected = "'a' is char and '1' is int and 'true' is bool" + Environment.NewLine;
            Assert.AreEqual(expected, codeWriter.ToString(false));
        }


        [Test]
        public void EnumerableFormatInFormat()
        {
            var codeWriter = new CodeWriter();
            codeWriter.Append($"Multiply:{Enumerable.Range(1, 4).Select(i => (FormattableString)$" {i} * 2 = {i * 2};")}");
            var expected = "Multiply: 1 * 2 = 2; 2 * 2 = 4; 3 * 2 = 6; 4 * 2 = 8;" + Environment.NewLine;
            Assert.AreEqual(expected, codeWriter.ToString(false));
        }

        [Test]
        public void SingleLineSummary()
        {
            var codeWriter = new CodeWriter();
            codeWriter.WriteXmlDocumentationSummary($"Some {typeof(string)} summary.");
            var expected = "/// <summary> Some string summary. </summary>" + Environment.NewLine;
            Assert.AreEqual(expected, codeWriter.ToString(false));
        }

        [Test]
        public void NoEmptySummary()
        {
            var codeWriter = new CodeWriter();
            codeWriter.WriteXmlDocumentationSummary($"{string.Empty}");
            var expected = string.Empty;
            Assert.AreEqual(expected, codeWriter.ToString(false));
        }

        [TestCase(typeof(string), false, "<see cref=\"string\"/>")]
        [TestCase(typeof(int), false, "<see cref=\"int\"/>")]
        [TestCase(typeof(int), true, "<see cref=\"int\"/>?")]
        [TestCase(typeof(List<>), false, "<see cref=\"global::System.Collections.Generic.List{T}\"/>")]
        [TestCase(typeof(KeyValuePair<,>), false, "<see cref=\"global::System.Collections.Generic.KeyValuePair{TKey,TValue}\"/>")]
        [TestCase(typeof(KeyValuePair<int,string>), true, "<see cref=\"global::System.Collections.Generic.KeyValuePair{TKey,TValue}\"/>? where <c>TKey</c> is of type <see cref=\"int\"/>, where <c>TValue</c> is of type <see cref=\"string\"/>")]
        public void SeeCRefType(Type type, bool isNullable, string expectedWritten)
        {
            var csType = new CSharpType(type).WithNullable(isNullable);
            var codeWriter = new CodeWriter();
            codeWriter.WriteXmlDocumentationSummary($"Some {csType:C} summary.");
            var expected = $"/// <summary> Some {expectedWritten} summary. </summary>" + Environment.NewLine;
            Assert.AreEqual(expected, codeWriter.ToString(false));
        }

        [Test]
        public void MultiLineSummary()
        {
            var codeWriter = new CodeWriter();
            FormattableString fs1 = $@"L04
L05
L06 {typeof(int)}


L09";
            FormattableString fs2 = $@"

L11 {typeof(bool)}
L12

";
            IEnumerable<FormattableString> fss = new[] {fs1, fs2};
            FormattableString fs = $@"L00
L01
L02 {typeof(string)}

{fss}
L15
L16";
            codeWriter.WriteXmlDocumentationSummary(fs);

            var expected = @"/// <summary>
/// L00
/// L01
/// L02 string
///
/// L04
/// L05
/// L06 int
///
///
/// L09
///
/// L11 bool
/// L12
///
///
/// L15
/// L16
/// </summary>
";
            Assert.AreEqual(expected, codeWriter.ToString(false));
        }
    }
}
