// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Statements
{
    public class XmlDocStatement : MethodBodyStatement
    {
        private const string SingleArgFormat = "{0}";

        public string StartTag { get; init; }
        public string EndTag { get; init; }
        public IReadOnlyList<FormattableString> Lines { get; init; }

        public XmlDocStatement(string startTag, string endTag, IReadOnlyList<FormattableString> lines)
        {
            StartTag = startTag;
            EndTag = endTag;
            Lines = lines;
        }

        internal override void Write(CodeWriter writer)
        {
            writer.WritingXmlDocumentation = true;

            if (Lines.Count == 0 || IsEmpty(Lines))
            {
                writer.WriteLine($"/// {StartTag}{EndTag}");
            }
            else if (Lines.Count == 1)
            {
                //should we auto add the '.'?
                string lineFormat = Lines[0].Format;
                string stringToCheck = lineFormat;
                if (lineFormat == SingleArgFormat && Lines[0].ArgumentCount == 1 && Lines[0].GetArgument(0) is string strLine)
                {
                    stringToCheck = strLine;
                }
                string period = stringToCheck.EndsWith(".") ? string.Empty : ".";
                writer.WriteLine($"/// {StartTag} {Lines[0]}{period} {EndTag}");
            }
            else
            {
                writer.WriteLine($"/// {StartTag}");
                foreach (var line in Lines)
                {
                    writer.WriteLine($"/// {line}");
                }
                writer.WriteLine($"/// {EndTag}");
            }

            writer.WritingXmlDocumentation = false;
        }

        private static bool IsEmpty(IReadOnlyList<FormattableString> lines)
        {
            if (lines.Count != 1)
            {
                return false;
            }

            string lineFormat = lines[0].Format;
            if (lineFormat.Equals(string.Empty))
            {
                return true;
            }

            if (lineFormat != SingleArgFormat)
            {
                return false;
            }

            var firstArg = lines[0].GetArgument(0);
            return firstArg is not null && firstArg.Equals(string.Empty);
        }
    }
}
