// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Diagnostics.CodeAnalysis;
using System.Text;
using Microsoft.CodeAnalysis.CSharp;

namespace Microsoft.TypeSpec.Generator.Input.Extensions
{
    public static class StringExtensions
    {
        private static bool IsWordSeparator(char c) => !SyntaxFacts.IsIdentifierPartCharacter(c) || c == '_';

        [return: NotNullIfNotNull("name")]
        public static string ToIdentifierName(this string name, bool isCamelCase = true)
        {
            if (string.IsNullOrEmpty(name))
            {
                return name;
            }
            StringBuilder nameBuilder = new StringBuilder();

            int i = 0;

            if (char.IsDigit(name[0]))
            {
                nameBuilder.Append("_");
            }
            else
            {
                while (!SyntaxFacts.IsIdentifierStartCharacter(name[i]))
                {
                    i++;
                }
            }

            bool upperCase = false;
            int firstWordLength = 1;
            for (; i < name.Length; i++)
            {
                var c = name[i];
                if (IsWordSeparator(c))
                {
                    upperCase = true;
                    continue;
                }

                if (nameBuilder.Length == 0 && isCamelCase)
                {
                    c = char.ToUpper(c);
                    upperCase = false;
                }
                else if (nameBuilder.Length < firstWordLength && !isCamelCase)
                {
                    c = char.ToLower(c);
                    upperCase = false;
                    // grow the first word length when this letter follows by two other upper case letters
                    // this happens in OSProfile, where OS is the first word
                    if (i + 2 < name.Length && char.IsUpper(name[i + 1]) && (char.IsUpper(name[i + 2]) || IsWordSeparator(name[i + 2])))
                        firstWordLength++;
                    // grow the first word length when this letter follows by another upper case letter and an end of the string
                    // this happens when the string only has one word, like OS, DNS
                    if (i + 2 == name.Length && char.IsUpper(name[i + 1]))
                        firstWordLength++;
                }

                if (upperCase)
                {
                    c = char.ToUpper(c);
                    upperCase = false;
                }

                nameBuilder.Append(c);
            }

            return nameBuilder.ToString();
        }

        [return: NotNullIfNotNull(nameof(name))]
        public static string ToVariableName(this string name) => name.ToIdentifierName(isCamelCase: false);

        public static string RemovePeriods(this string input)
        {
            if (string.IsNullOrEmpty(input))
                return input;

            Span<char> buffer = stackalloc char[input.Length];
            int index = 0;

            foreach (char c in input)
            {
                if (c != '.')
                    buffer[index++] = c;
            }

            return buffer.Slice(0, index).ToString();
        }

        /// <summary>
        /// Checks if two namespaces share the same last segment
        /// </summary>
        /// <param name="left">the first namespace</param>
        /// <param name="right">the second namespace</param>
        /// <returns></returns>
        public static bool IsLastNamespaceSegmentTheSame(string left, string right)
        {
            // finish this via Span API
            var leftSpan = left.AsSpan();
            var rightSpan = right.AsSpan();
            // swap if left is longer, we ensure left is the shorter one
            if (leftSpan.Length > rightSpan.Length)
            {
                var temp = leftSpan;
                leftSpan = rightSpan;
                rightSpan = temp;
            }
            for (int i = 1; i <= leftSpan.Length; i++)
            {
                var lc = leftSpan[^i];
                var rc = rightSpan[^i];
                // check if each char is the same from the right-most side
                // if both of them are dot, we finished scanning the last segment - and if we could be here, meaning all of them are the same, return true.
                if (lc == '.' && rc == '.')
                {
                    return true;
                }
                // if these are different - there is one different character, return false.
                if (lc != rc)
                {
                    return false;
                }
            }

            // we come here because we run out of characters in left - which means left does not have a dot.
            // if they have the same length, they are identical, return true
            if (leftSpan.Length == rightSpan.Length)
            {
                return true;
            }
            // otherwise, right is longer, we check its next character, if it is the dot, return true, otherwise return false.
            return rightSpan[^(leftSpan.Length + 1)] == '.';
        }
    }
}
