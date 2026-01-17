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
                return markdown;

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
                else if (Regex.IsMatch(trimmedLine, @"^\d+\.\s"))
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
                    var match = Regex.Match(trimmedLine, @"^\d+\.\s+(.*)");
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

            return result.ToString();
        }

        private static void AppendList(StringBuilder result, string listType, List<string> items)
        {
            if (items.Count == 0)
                return;

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
        /// Converts inline markdown (bold and italic) to XML tags.
        /// Handles: **bold**, ***bold italic***, *italic*
        /// </summary>
        private static string ConvertInlineMarkdown(string text)
        {
            if (string.IsNullOrEmpty(text))
                return text;

            // Handle ***bold italic*** (must be done before ** and *)
            text = Regex.Replace(text, @"\*\*\*([^*]+?)\*\*\*", "<b><i>$1</i></b>");

            // Handle **bold**
            text = Regex.Replace(text, @"\*\*([^*]+?)\*\*", "<b>$1</b>");

            // Handle *italic* (but not already processed bold markers)
            text = Regex.Replace(text, @"(?<!\*)\*([^*]+?)\*(?!\*)", "<i>$1</i>");

            return text;
        }
    }
}
