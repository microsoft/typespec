// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Utilities
{
    public class StringExtensionsTests
    {

        [TestCase("abstract", true)]
        [TestCase("add", true)]
        [TestCase("alias", true)]
        [TestCase("as", true)]
        [TestCase("ascending", true)]
        [TestCase("async", true)]
        [TestCase("await", true)]
        [TestCase("base", true)]
        [TestCase("bool", true)]
        [TestCase("break", true)]
        [TestCase("by", true)]
        [TestCase("byte", true)]
        [TestCase("case", true)]
        [TestCase("catch", true)]
        [TestCase("char", true)]
        [TestCase("checked", true)]
        [TestCase("class", true)]
        [TestCase("const", true)]
        [TestCase("continue", true)]
        [TestCase("decimal", true)]
        [TestCase("default", true)]
        [TestCase("delegate", true)]
        [TestCase("descending", true)]
        [TestCase("do", true)]
        [TestCase("double", true)]
        [TestCase("dynamic", false)]
        [TestCase("else", true)]
        [TestCase("enum", true)]
        [TestCase("equals", true)]
        [TestCase("event", true)]
        [TestCase("explicit", true)]
        [TestCase("extern", true)]
        [TestCase("false", true)]
        [TestCase("finally", true)]
        [TestCase("fixed", true)]
        [TestCase("float", true)]
        [TestCase("for", true)]
        [TestCase("foreach", true)]
        [TestCase("from", true)]
        [TestCase("get", true)]
        [TestCase("global", true)]
        [TestCase("goto", true)]
        [TestCase("if", true)]
        [TestCase("implicit", true)]
        [TestCase("in", true)]
        [TestCase("int", true)]
        [TestCase("interface", true)]
        [TestCase("internal", true)]
        [TestCase("into", true)]
        [TestCase("is", true)]
        [TestCase("join", true)]
        [TestCase("let", true)]
        [TestCase("lock", true)]
        [TestCase("long", true)]
        [TestCase("nameof", true)]
        [TestCase("namespace", true)]
        [TestCase("new", true)]
        [TestCase("null", true)]
        [TestCase("object", true)]
        [TestCase("on", true)]
        [TestCase("operator", true)]
        [TestCase("out", true)]
        [TestCase("override", true)]
        [TestCase("params", true)]
        [TestCase("partial", true)]
        [TestCase("private", true)]
        [TestCase("protected", true)]
        [TestCase("public", true)]
        [TestCase("readonly", true)]
        [TestCase("ref", true)]
        [TestCase("remove", true)]
        [TestCase("return", true)]
        [TestCase("sbyte", true)]
        [TestCase("sealed", true)]
        [TestCase("set", true)]
        [TestCase("short", true)]
        [TestCase("sizeof", true)]
        [TestCase("stackalloc", true)]
        [TestCase("static", true)]
        [TestCase("string", true)]
        [TestCase("struct", true)]
        [TestCase("switch", true)]
        [TestCase("this", true)]
        [TestCase("throw", true)]
        [TestCase("true", true)]
        [TestCase("try", true)]
        [TestCase("typeof", true)]
        [TestCase("uint", true)]
        [TestCase("ulong", true)]
        [TestCase("unchecked", true)]
        [TestCase("unmanaged", true)]
        [TestCase("unsafe", true)]
        [TestCase("ushort", true)]
        [TestCase("using", true)]
        [TestCase("var", true)]
        [TestCase("virtual", true)]
        [TestCase("void", true)]
        [TestCase("volatile", true)]
        [TestCase("when", true)]
        [TestCase("where", true)]
        [TestCase("while", true)]
        [TestCase("yield", true)]
        public void TestIsCSharpKeyword(string name, bool isKeyword)
        {
            var result = StringExtensions.IsCSharpKeyword(name);
            Assert.AreEqual(isKeyword, result);
        }

        [TestCase("1.0.0", "V1_0_0")]
        [TestCase("v1.0.0", "V1_0_0")]
        [TestCase("V1.0.0", "V1_0_0")]
        [TestCase("V2022.05.15_Preview", "V2022_05_15_Preview")]
        [TestCase("v2022.05.15_Preview", "V2022_05_15_Preview")]
        [TestCase("V2022.05.15-preview", "V2022_05_15_Preview")]
        public void TestToApiVersionMemberName(string apiVersion, string expectedApiVersion)
        {
            var name = apiVersion.ToApiVersionMemberName();
            Assert.AreEqual(expectedApiVersion, name);
        }

        [TestCaseSource(nameof(BuildFormattableStringFormatParts))]
        public void ValidateGetFormattableStringFormatParts(string format, IReadOnlyList<Part> parts)
        {
            var i = 0;
            foreach (var (span, isLiteral, index) in StringExtensions.GetFormattableStringFormatParts(format))
            {
                Assert.AreEqual(parts[i].Value, span.ToString());
                Assert.AreEqual(parts[i].IsLiteral, isLiteral);
                Assert.AreEqual(parts[i].ArgumentIndex, index);
                i++;
            }
        }

        public record Part(string Value, bool IsLiteral, int ArgumentIndex);

        public static IEnumerable<TestCaseData> BuildFormattableStringFormatParts
        {
            get
            {
                // simple case with only arguments
                yield return new TestCaseData("{0}{1}", new Part[]
                {
                    new Part("0", false, 0),
                    new Part("1", false, 1)
                });
                // simple case with only literals
                yield return new TestCaseData("something", new Part[]
                {
                    new Part("something", true, -1) // literals do not have an argument index
                });
                // mixed case with both arguments and literals
                yield return new TestCaseData("something{0}else{1}", new Part[]
                {
                    new Part("something", true, -1),
                    new Part("0", false, 0),
                    new Part("else", true, -1),
                    new Part("1", false, 1)
                });
                // when the format contains a { or } literal at its end
                FormattableString fs = $"This {"fs"} has literal {{";
                yield return new TestCaseData(fs.Format, new Part[]
                {
                    new Part("This ", true, -1),
                    new Part("0", false, 0),
                    new Part(" has literal {", true, -1)
                });
                // when the format contains a { or } literal at its end
                fs = $"This {"fs"} has literal }}";
                yield return new TestCaseData(fs.Format, new Part[]
                {
                    new Part("This ", true, -1),
                    new Part("0", false, 0),
                    new Part(" has literal }", true, -1)
                });
                // when the format contains a { or } literal in its middle
                fs = $"This {"fs"} has literal }} and {"fs"}";
                yield return new TestCaseData(fs.Format, new Part[]
                {
                    new Part("This ", true, -1),
                    new Part("0", false, 0),
                    new Part(" has literal }", true, -1), // the implementation will break up the literals by { and } and unescape them
                    new Part(" and ", true, -1),
                    new Part("1", false, 1)
                });
                // when the format contains both literal { and } in its middle
                fs = $"This {"fs"} has literal {{ and }} in the middle";
                yield return new TestCaseData(fs.Format, new Part[]
                {
                    new Part("This ", true, -1),
                    new Part("0", false, 0),
                    new Part(" has literal {", true, -1),
                    new Part(" and }", true, -1),
                    new Part(" in the middle", true, -1)
                });
                // when the format contains both literal { and } in its middle but separated by an argument
                fs = $"This {"fs"} has literal {{, {"fs"} and }} in the middle";
                yield return new TestCaseData(fs.Format, new Part[]
                {
                    new Part("This ", true, -1),
                    new Part("0", false, 0),
                    new Part(" has literal {", true, -1),
                    new Part(", ", true, -1),
                    new Part("1", false, 1),
                    new Part(" and }", true, -1),
                    new Part(" in the middle", true, -1)
                });
            }
        }
    }
}
