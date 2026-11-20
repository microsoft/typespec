// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Diagnostics.CodeAnalysis;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.CodeAnalysis.CSharp;

namespace Microsoft.TypeSpec.Generator.Input.Extensions
{
    public static class StringExtensions
    {
        private static readonly Regex _uppercaseWords = new("""
            (?<!\p{Lu})(?!IPV[46](?![\p{L}\p{M}\p{N}]))              # Preserve IPV4 and IPV6
            \p{Lu}{3,}(?=\p{Lu}\p{Ll}|\p{N}*(?![\p{L}\p{M}\p{N}])) # Long uppercase runs, e.g. HTTP in HTTPStatus or HTTP2
            | (?<![\p{L}\p{M}\p{N}])\p{Lu}{2}(?![\p{L}\p{M}\p{N}])    # Standalone two-letter words, e.g. OR
            """, RegexOptions.IgnorePatternWhitespace);

        public static string ToPascalCaseIdentifierName(this string name) =>
            _uppercaseWords.Replace(name, static match => match.Value[..1] + match.Value[1..].ToLowerInvariant())
                .ToIdentifierName();

        private static bool IsWordSeparator(char c, bool preserveUnderscores = false)
            => !SyntaxFacts.IsIdentifierPartCharacter(c) || (!preserveUnderscores && c == '_');

        [return: NotNullIfNotNull("name")]
        public static string ToIdentifierName(this string name, bool useCamelCase = false, bool preserveUnderscores = false)
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
                if (IsWordSeparator(c, preserveUnderscores))
                {
                    upperCase = true;
                    continue;
                }

                if (nameBuilder.Length == 0 && !useCamelCase)
                {
                    c = char.ToUpper(c);
                    upperCase = false;
                }
                else if (nameBuilder.Length < firstWordLength && useCamelCase)
                {
                    c = char.ToLower(c);
                    upperCase = false;
                    // grow the first word length when this letter follows by two other upper case letters
                    // this happens in OSProfile, where OS is the first word
                    if (i + 2 < name.Length && char.IsUpper(name[i + 1]) && (char.IsUpper(name[i + 2]) || IsWordSeparator(name[i + 2], preserveUnderscores)))
                    {
                        firstWordLength++;
                    }
                    // grow the first word length when this letter follows by another upper case letter and an end of the string
                    // this happens when the string only has one word, like OS, DNS
                    if (i + 2 == name.Length && char.IsUpper(name[i + 1]))
                    {
                        firstWordLength++;
                    }
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
        public static string ToVariableName(
            this string name,
            bool preserveUnderscores = false,
            bool normalizeAcronyms = true)
        {
            var variableName = name.ToIdentifierName(useCamelCase: true, preserveUnderscores: preserveUnderscores);
            if (normalizeAcronyms &&
                variableName is { Length: >= 4 } &&
                variableName[0] == 'i' &&
                variableName[1] == 'P' &&
                variableName[2] == 'v' &&
                (variableName[3] == '4' || variableName[3] == '6') &&
                (variableName.Length == 4 || char.IsUpper(variableName[4])))
            {
                return $"ip{variableName.Substring(2)}";
            }

            return variableName;
        }
    }
}
