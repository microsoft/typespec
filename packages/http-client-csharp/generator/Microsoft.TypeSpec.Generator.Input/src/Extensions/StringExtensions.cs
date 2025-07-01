// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Diagnostics.CodeAnalysis;
using System.Text;
using Microsoft.CodeAnalysis.CSharp;

namespace Microsoft.TypeSpec.Generator.Input.Extensions
{
    /// <summary>
    /// Provides extension methods for string manipulation and identifier generation.
    /// </summary>
    public static class StringExtensions
    {
        private static bool IsWordSeparator(char c) => !SyntaxFacts.IsIdentifierPartCharacter(c) || c == '_';

        [return: NotNullIfNotNull("name")]
        /// <summary>
        /// Converts a string to a valid C# identifier name, optionally using camel case.
        /// </summary>
        /// <param name="name">The string to convert to an identifier name.</param>
        /// <param name="useCamelCase">Whether to use camel case for the identifier.</param>
        /// <returns>A valid C# identifier name.</returns>
        public static string ToIdentifierName(this string name, bool useCamelCase = false)
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
        /// <summary>
        /// Converts a string to a valid C# variable name using camel case.
        /// </summary>
        /// <param name="name">The string to convert to a variable name.</param>
        /// <returns>A valid C# variable name in camel case.</returns>
        public static string ToVariableName(this string name) => name.ToIdentifierName(useCamelCase: true);
    }
}
