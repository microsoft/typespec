// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;

namespace Microsoft.TypeSpec.Generator.Utilities
{
    public class DocHelpers
    {
        // Pre-compiled regex patterns for better performance
        private static readonly Regex NumberedListRegex = new Regex(@"^\d+\.\s", RegexOptions.Compiled);
        private static readonly Regex NumberedListCaptureRegex = new Regex(@"^\d+\.\s+(.*)", RegexOptions.Compiled);
        private static readonly Regex BoldItalicRegex = new Regex(@"\*\*\*([^*]+?)\*\*\*", RegexOptions.Compiled);
        private static readonly Regex BoldRegex = new Regex(@"\*\*([^*]+?)\*\*", RegexOptions.Compiled);
        private static readonly Regex ItalicRegex = new Regex(@"(?<!\*)\*([^*]+?)\*(?!\*)", RegexOptions.Compiled);
        private const char CodeSpanDelimiter = '`';

        public static string? GetDescription(string? summary, string? doc)
        {
            var description = (summary, doc) switch
            {
                (null or "", null or "") => null,
                (string s, null or "") => s,
                _ => doc,
            };

            return description != null ? ConvertMarkdownToXml(description) : null;
        }

        public static FormattableString? GetFormattableDescription(string? summary, string? doc)
        {
            return FormattableStringHelpers.FromString(GetDescription(summary, doc));
        }

        /// <summary>
        /// Converts markdown syntax to C# XML documentation syntax.
        /// Handles bold (**text**), italic (*text*), bullet lists (- item), and numbered lists (1. item).
        /// </summary>
        internal static string ConvertMarkdownToXml(string markdown)
        {
            if (string.IsNullOrEmpty(markdown))
            {
                return markdown;
            }

            markdown = ProtectCodeSpanAsterisks(markdown, out var asteriskPlaceholder);
            var lines = markdown.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.None);
            var result = new StringBuilder();
            var inList = false;
            var listType = "";
            var listItems = new List<string>();

            for (int i = 0; i < lines.Length; i++)
            {
                var line = lines[i];
                var trimmedLine = line.TrimStart();

                // Check for bullet list item
                if (trimmedLine.StartsWith("- "))
                {
                    if (!inList || listType != "bullet")
                    {
                        // Flush previous list if different type
                        if (inList)
                        {
                            AppendList(result, listType, listItems);
                            listItems.Clear();
                        }
                        inList = true;
                        listType = "bullet";
                    }
                    // Remove the "- " prefix and add to list items
                    listItems.Add(ConvertInlineMarkdown(trimmedLine.Substring(2)));
                }
                // Check for numbered list item (e.g., "1. ", "2. ")
                else if (NumberedListRegex.IsMatch(trimmedLine))
                {
                    if (!inList || listType != "number")
                    {
                        // Flush previous list if different type
                        if (inList)
                        {
                            AppendList(result, listType, listItems);
                            listItems.Clear();
                        }
                        inList = true;
                        listType = "number";
                    }
                    // Remove the number prefix and add to list items
                    var match = NumberedListCaptureRegex.Match(trimmedLine);
                    listItems.Add(ConvertInlineMarkdown(match.Groups[1].Value));
                }
                else
                {
                    // Not a list item, flush any pending list
                    if (inList)
                    {
                        AppendList(result, listType, listItems);
                        listItems.Clear();
                        inList = false;
                    }

                    // Process inline markdown (bold, italic) for regular lines
                    var processedLine = ConvertInlineMarkdown(line);

                    // Add line to result
                    if (result.Length > 0 && !string.IsNullOrWhiteSpace(processedLine))
                    {
                        result.AppendLine();
                    }
                    result.Append(processedLine);
                }
            }

            // Flush any remaining list
            if (inList)
            {
                AppendList(result, listType, listItems);
            }

            return result.ToString().Replace(asteriskPlaceholder, "*");
        }

        private static void AppendList(StringBuilder result, string listType, List<string> items)
        {
            if (items.Count == 0)
            {
                return;
            }

            if (result.Length > 0)
            {
                result.AppendLine();
            }

            result.Append($"<list type=\"{listType}\">");
            foreach (var item in items)
            {
                result.Append($"<item><description>{item}</description></item>");
            }
            result.Append("</list>");
        }

        /// <summary>
        /// Converts inline markdown (bold and italic) to XML tags, leaving the content of code spans (`code`) literal.
        /// Handles: **bold**, ***bold italic***, *italic*
        /// </summary>
        private static string ConvertInlineMarkdown(string text)
        {
            if (string.IsNullOrEmpty(text) || text.IndexOf(CodeSpanDelimiter) < 0)
            {
                return ConvertEmphasis(text);
            }

            var result = new StringBuilder(text.Length);
            var pendingText = new StringBuilder();
            var position = 0;

            while (position < text.Length)
            {
                var delimiterStart = text.IndexOf(CodeSpanDelimiter, position);
                if (delimiterStart < 0)
                {
                    pendingText.Append(text, position, text.Length - position);
                    break;
                }

                var delimiterLength = GetDelimiterLength(text, delimiterStart);
                var codeSpanEnd = FindCodeSpanEnd(text, delimiterStart + delimiterLength, delimiterLength);
                if (codeSpanEnd < 0)
                {
                    pendingText.Append(text, position, delimiterStart + delimiterLength - position);
                    position = delimiterStart + delimiterLength;
                    continue;
                }

                pendingText.Append(text, position, delimiterStart - position);
                result.Append(ConvertEmphasis(pendingText.ToString()));
                pendingText.Clear();
                result.Append(text, delimiterStart, codeSpanEnd - delimiterStart);
                position = codeSpanEnd;
            }

            result.Append(ConvertEmphasis(pendingText.ToString()));

            return result.ToString();
        }

        private static string ConvertEmphasis(string text)
        {
            if (string.IsNullOrEmpty(text))
            {
                return text;
            }

            // Handle ***bold italic*** (must be done before ** and *)
            text = BoldItalicRegex.Replace(text, "<b><i>$1</i></b>");

            // Handle **bold**
            text = BoldRegex.Replace(text, "<b>$1</b>");

            // Handle *italic* (but not already processed bold markers)
            return ItalicRegex.Replace(text, "<i>$1</i>");
        }

        private static string ProtectCodeSpanAsterisks(string text, out string asteriskPlaceholder)
        {
            // Protect literal asterisks even when emphasis surrounds a code span.
            asteriskPlaceholder = "\0";
            while (text.Contains(asteriskPlaceholder, StringComparison.Ordinal))
            {
                asteriskPlaceholder += "_";
            }

            var protectedAsterisks = new bool[text.Length];
            var searchIndex = 0;
            while (FindNextCodeSpan(text, searchIndex, out var codeSpanStart, out var codeSpanEnd))
            {
                for (int i = codeSpanStart; i < codeSpanEnd; i++)
                {
                    if (text[i] == '*')
                    {
                        protectedAsterisks[i] = true;
                    }
                }

                searchIndex = codeSpanEnd;
            }

            var protectedText = new StringBuilder();
            for (int i = 0; i < text.Length; i++)
            {
                if (protectedAsterisks[i])
                {
                    protectedText.Append(asteriskPlaceholder);
                }
                else
                {
                    protectedText.Append(text[i]);
                }
            }
            return protectedText.ToString();
        }

        private static bool FindNextCodeSpan(string text, int searchIndex, out int codeSpanStart, out int codeSpanEnd)
        {
            while (searchIndex < text.Length)
            {
                if (text[searchIndex] != '`')
                {
                    searchIndex++;
                    continue;
                }

                var delimiterStart = searchIndex;
                var delimiterEnd = GetBacktickRunEnd(text, delimiterStart);
                var delimiterLength = delimiterEnd - delimiterStart;

                var precedingBackslashes = 0;
                for (int i = delimiterStart - 1; i >= 0 && text[i] == '\\'; i--)
                {
                    precedingBackslashes++;
                }

                if (precedingBackslashes % 2 != 0)
                {
                    searchIndex = delimiterStart + 1;
                    continue;
                }

                var closingSearchIndex = delimiterEnd;
                while (closingSearchIndex < text.Length)
                {
                    if ((text[closingSearchIndex] == '\r' || text[closingSearchIndex] == '\n') &&
                        IsMarkdownBlockBoundary(text, closingSearchIndex))
                    {
                        break;
                    }

                    if (text[closingSearchIndex] != '`')
                    {
                        closingSearchIndex++;
                        continue;
                    }

                    var closingDelimiterEnd = GetBacktickRunEnd(text, closingSearchIndex);
                    if (closingDelimiterEnd - closingSearchIndex == delimiterLength)
                    {
                        codeSpanStart = delimiterStart;
                        codeSpanEnd = closingDelimiterEnd;
                        return true;
                    }

                    closingSearchIndex = closingDelimiterEnd;
                }

                searchIndex = delimiterEnd;
            }

            codeSpanStart = 0;
            codeSpanEnd = 0;
            return false;
        }

        private static bool IsMarkdownBlockBoundary(string text, int lineBreakIndex)
        {
            var nextLineStart = lineBreakIndex + 1;
            if (text[lineBreakIndex] == '\r' && nextLineStart < text.Length && text[nextLineStart] == '\n')
            {
                nextLineStart++;
            }

            var nextLineEnd = nextLineStart;
            while (nextLineEnd < text.Length && text[nextLineEnd] != '\r' && text[nextLineEnd] != '\n')
            {
                nextLineEnd++;
            }

            var nextLine = text.Substring(nextLineStart, nextLineEnd - nextLineStart);
            if (string.IsNullOrWhiteSpace(nextLine))
            {
                return true;
            }

            var trimmedLine = nextLine.TrimStart();
            return trimmedLine.StartsWith("- ", StringComparison.Ordinal) || NumberedListRegex.IsMatch(trimmedLine);
        }

        private static int GetBacktickRunEnd(string text, int startIndex)
        {
            var endIndex = startIndex;
            while (endIndex < text.Length && text[endIndex] == '`')
            {
                endIndex++;
            }

            return endIndex;
        }

        private static int GetDelimiterLength(string text, int start)
        {
            var end = start;
            while (end < text.Length && text[end] == CodeSpanDelimiter)
            {
                end++;
            }

            return end - start;
        }

        private static int FindCodeSpanEnd(string text, int searchStart, int delimiterLength)
        {
            var position = searchStart;
            while (position < text.Length)
            {
                if (text[position] != CodeSpanDelimiter)
                {
                    position++;
                    continue;
                }

                var runLength = GetDelimiterLength(text, position);
                if (runLength == delimiterLength)
                {
                    return position + runLength;
                }

                position += runLength;
            }

            return -1;
        }
    }
}
