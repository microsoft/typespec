// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// cSpell:ignore apos

using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Text;

namespace Microsoft.Generator.CSharp.Statements
{
    public class XmlDocStatement : MethodBodyStatement
    {
        private const string SingleArgFormat = "{0}";
        private List<FormattableString> _lines;

        public string StartTag { get; init; }
        public string EndTag { get; init; }
        public IReadOnlyList<FormattableString> Lines => _lines;
        public IReadOnlyList<XmlDocStatement> InnerStatements { get; }

        public XmlDocStatement(string tagName, IEnumerable<FormattableString> lines, params XmlDocStatement[] innerStatements)
            : this($"<{tagName}>", $"</{tagName}>", lines, innerStatements)
        {
        }

        public XmlDocStatement(string startTag, string endTag, IEnumerable<FormattableString> lines, params XmlDocStatement[] innerStatements)
        {
            StartTag = startTag;
            EndTag = endTag;
            _lines = NormalizeLines(lines);
            InnerStatements = innerStatements;
        }

        private List<FormattableString> NormalizeLines(IEnumerable<FormattableString> lines)
        {
            List<FormattableString> result = new List<FormattableString>();

            // break lines if they have line breaks
            foreach (var line in lines)
            {
                var breakLines = FormattableStringHelpers.BreakLines(line);
                result.AddRange(breakLines);
            }

            // escape lines if they have invalid characters
            for (int i = 0; i < result.Count; i++)
            {
                var line = result[i];
                result[i] = FormattableStringFactory.Create(EscapeLine(line.Format), EscapeArguments(line.GetArguments()));
            }

            return result;
        }

        private static object?[] EscapeArguments(object?[] objects)
        {
            if (objects is null)
                return Array.Empty<object?>();

            object?[] args = new object?[objects.Length];
            for (int i = 0; i < objects.Length; i++)
            {
                if (objects[i] is string str)
                {
                    args[i] = EscapeLine(str);
                }
                else
                {
                    args[i] = objects[i];
                }
            }
            return args;
        }

        internal override void Write(CodeWriter writer)
        {
            using var scope = new CodeWriter.XmlDocWritingScope(writer);

            if (Lines.Count > 1 || InnerStatements.Count > 0)
            {
                WriteMultiLine(writer);
            }
            else
            {
                WriteSingleLine(writer);
            }
        }

        private void WriteSingleLine(CodeWriter writer)
        {
            if (Lines.Count == 0 || IsEmptySingleLine(Lines))
            {
                writer.WriteLine($"/// {StartTag}{EndTag}");
            }
            else
            {
                string periodOrEmpty = GetPeriodOrEmpty(Lines[0]);
                writer.WriteLine($"/// {StartTag} {Lines[0]}{periodOrEmpty} {EndTag}");
            }
        }

        private void WriteMultiLine(CodeWriter writer)
        {
            writer.WriteLine($"/// {StartTag}");
            foreach (var line in Lines)
            {
                writer.WriteLine($"/// {line}");
            }
            foreach (var inner in InnerStatements)
            {
                inner.Write(writer);
            }
            writer.WriteLine($"/// {EndTag}");
        }

        private string GetPeriodOrEmpty(FormattableString formattableString)
        {
            // for single line comment we always want the line to end in a period.

            string lineFormat = Lines[0].Format;
            string stringToCheck = lineFormat;
            if (lineFormat == SingleArgFormat && Lines[0].ArgumentCount == 1 && Lines[0].GetArgument(0) is string strLine)
            {
                stringToCheck = strLine;
            }
            return stringToCheck.EndsWith(".") ? string.Empty : ".";
        }

        private static bool IsEmptySingleLine(IReadOnlyList<FormattableString> lines)
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

        private const string EscapedAmpersand = "&amp;";
        private const string EscapedLessThan = "&lt;";
        private const string EscapedGreaterThan = "&gt;";
        private const string EscapedApostrophe = "&apos;";
        private const string EscapedQuote = "&quot;";
        public static string EscapeLine(string s)
        {
            if (string.IsNullOrEmpty(s))
                return s;

            var span = s.AsSpan();
            Dictionary<int, string> replacements = new Dictionary<int, string>();
            for (int i = 0; i < span.Length; i++)
            {
                switch (span[i])
                {
                    case '&':
                        if (IsAlreadyEscaped(ref span, i, out int escapeLength))
                        {
                            i += escapeLength;
                        }
                        else
                        {
                            replacements.Add(i, EscapedAmpersand);
                        }
                        break;
                    case '<':
                        if (!SkipValidTag(ref span, ref i))
                        {
                            replacements.Add(i, EscapedLessThan);
                        }
                        break;
                    case '>':
                        replacements.Add(i, EscapedGreaterThan);
                        break;
                }
            }
            if (replacements.Count > 0)
            {
                StringBuilder sb = new StringBuilder();
                int lastStart = 0;
                foreach (var kv in replacements)
                {
                    sb.Append(span.Slice(lastStart, kv.Key - lastStart));
                    sb.Append(kv.Value);
                    lastStart = kv.Key + 1;
                }
                sb.Append(span.Slice(lastStart));
                return sb.ToString();
            }
            return s;
        }

        private const string SeeCrefStart = "<see ";
        private const string SeeCrefEnd = "</see>";
        private static bool SkipValidTag(ref ReadOnlySpan<char> span, ref int i)
        {
            var slice = span.Slice(i);
            if (slice.StartsWith(SeeCrefStart.AsSpan(), StringComparison.Ordinal) || slice.StartsWith(SeeCrefEnd.AsSpan(), StringComparison.Ordinal))
            {
                i += slice.IndexOf('>');
                return true;
            }
            return false;
        }

        private static bool IsAlreadyEscaped(ref ReadOnlySpan<char> span, int i, out int escapeLength)
        {
            return IsEscapedMatch(ref span, i, EscapedAmpersand, out escapeLength) ||
                IsEscapedMatch(ref span, i, EscapedLessThan, out escapeLength) ||
                IsEscapedMatch(ref span, i, EscapedGreaterThan, out escapeLength) ||
                IsEscapedMatch(ref span, i, EscapedApostrophe, out escapeLength) ||
                IsEscapedMatch(ref span, i, EscapedQuote, out escapeLength);
        }

        private static bool IsEscapedMatch(ref ReadOnlySpan<char> span, int i, string escapedChar, out int escapeLength)
        {
            escapeLength = 0;
            if (span.Length < i + escapedChar.Length)
                return false;

            var slice = span.Slice(i, escapedChar.Length);
            var isMatch = slice.Equals(escapedChar.AsSpan(), StringComparison.Ordinal);
            if (isMatch)
                escapeLength = slice.Length;
            return isMatch;
        }
    }
}
