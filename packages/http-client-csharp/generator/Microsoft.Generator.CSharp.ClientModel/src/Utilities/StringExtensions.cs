// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.CodeAnalysis.CSharp;

namespace Microsoft.Generator.CSharp.ClientModel
{
    internal static class StringExtensions
    {
        private static bool IsWordSeparator(char c) => !SyntaxFacts.IsIdentifierPartCharacter(c) || c == '_';
        private static readonly Regex HumanizedCamelCaseRegex = new Regex(@"([A-Z])", RegexOptions.Compiled);

        [return: NotNullIfNotNull("name")]
        public static string ToCleanName(this string name, bool isCamelCase = true)
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
        public static string ToVariableName(this string name) => ToCleanName(name, isCamelCase: false);

        public static string FirstCharToUpperCase(this string str)
        {
            if (string.IsNullOrEmpty(str))
                return str;

            var strSpan = str.AsSpan();

            if (char.IsUpper(strSpan[0]))
                return str;

            Span<char> span = stackalloc char[strSpan.Length];
            strSpan.CopyTo(span);
            span[0] = char.ToUpper(span[0]);
            return new string(span);
        }


        public static IEnumerable<string> SplitByCamelCase(this string camelCase)
        {
            var humanizedString = HumanizedCamelCaseRegex.Replace(camelCase, "$1");
            return humanizedString.Split(' ').Select(w => w.FirstCharToUpperCase());
        }
    }
}
