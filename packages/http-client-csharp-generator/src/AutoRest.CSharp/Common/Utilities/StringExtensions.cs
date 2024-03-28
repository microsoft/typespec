// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Text;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Mgmt.Models;
using AutoRest.CSharp.Mgmt.Report;
using Humanizer;
using Humanizer.Inflections;
using Microsoft.CodeAnalysis.CSharp;

namespace AutoRest.CSharp.Utilities
{
    internal static class StringExtensions
    {
        static StringExtensions()
        {
            Vocabularies.Default.AddUncountable("data");
            // "S".Singularize() throws exception, github issue link: https://github.com/Humanizr/Humanizer/issues/1154
            Vocabularies.Default.AddUncountable("S");
            Vocabularies.Default.AddIrregular("redis", "redis");
        }

        public static bool IsNullOrEmpty(this string? text) => string.IsNullOrEmpty(text);
        public static bool IsNullOrWhiteSpace(this string? text) => string.IsNullOrWhiteSpace(text);

        private static bool IsWordSeparator(char c) => !SyntaxFacts.IsIdentifierPartCharacter(c) || c == '_';

        [return: NotNullIfNotNull("name")]
        public static string ToCleanName(this string name, bool isCamelCase = true)
        {
            if (name.IsNullOrEmpty())
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

        [return: NotNullIfNotNull("name")]
        public static string ToVariableName(this string name) => Configuration.AzureArm ? name.ToMgmtVariableName() : ToCleanName(name, isCamelCase: false);

        [return: NotNullIfNotNull("name")]
        public static string ToMgmtVariableName(this string name)
        {
            string? tempName = name;
            var newName = NameTransformer.Instance.EnsureNameCase(name, (applyStep) =>
            {
                // for variable name, only log when some real changes occur.
                if (tempName != applyStep.NewName.VariableName)
                {
                    var finalName = ToCleanName(applyStep.NewName.VariableName, isCamelCase: false);
                    MgmtReport.Instance.TransformSection.AddTransformLogForApplyChange(
                        TransformTypeName.AcronymMapping, applyStep.MappingKey, applyStep.MappingValue.RawValue,
                        $"Variables.{name}",
                        $"ApplyAcronymMappingOnVariable", tempName, $"{applyStep.NewName.VariableName}(ToCleanName={finalName})");
                    tempName = applyStep.NewName.VariableName;
                }
            });

            return ToCleanName(newName.VariableName, isCamelCase: false);
        }

        public static GetPathPartsEnumerator GetPathParts(string? path) => new GetPathPartsEnumerator(path);

        public ref struct GetPathPartsEnumerator
        {
            private ReadOnlySpan<char> _path;
            public Part Current { get; private set; }

            public GetPathPartsEnumerator(ReadOnlySpan<char> path)
            {
                _path = path;
                Current = default;
            }

            public GetPathPartsEnumerator GetEnumerator() => this;

            public bool MoveNext()
            {
                var span = _path;
                if (span.Length == 0)
                {
                    return false;
                }

                var separatorIndex = span.IndexOfAny('{', '}');

                if (separatorIndex == -1)
                {
                    Current = new Part(span, true);
                    _path = ReadOnlySpan<char>.Empty;
                    return true;
                }

                var separator = span[separatorIndex];
                // Handle {{ and }} escape sequences
                if (separatorIndex + 1 < span.Length && span[separatorIndex + 1] == separator)
                {
                    Current = new Part(span.Slice(0, separatorIndex + 1), true);
                    _path = span.Slice(separatorIndex + 2);
                    return true;
                }

                var isLiteral = separator == '{';

                // Skip empty literals
                if (isLiteral && separatorIndex == 0 && span.Length > 1)
                {
                    separatorIndex = span.IndexOf('}');
                    if (separatorIndex == -1)
                    {
                        Current = new Part(span.Slice(1), true);
                        _path = ReadOnlySpan<char>.Empty;
                        return true;
                    }

                    Current = new Part(span.Slice(1, separatorIndex - 1), false);
                }
                else
                {
                    Current = new Part(span.Slice(0, separatorIndex), isLiteral);
                }

                _path = span.Slice(separatorIndex + 1);
                return true;
            }

            public readonly ref struct Part
            {
                public Part(ReadOnlySpan<char> span, bool isLiteral)
                {
                    Span = span;
                    IsLiteral = isLiteral;
                }

                public ReadOnlySpan<char> Span { get; }
                public bool IsLiteral { get; }

                public void Deconstruct(out ReadOnlySpan<char> span, out bool isLiteral)
                {
                    span = Span;
                    isLiteral = IsLiteral;
                }

                public void Deconstruct(out ReadOnlySpan<char> span, out bool isLiteral, out int argumentIndex)
                {
                    span = Span;
                    isLiteral = IsLiteral;

                    if (IsLiteral)
                    {
                        argumentIndex = -1;
                    }
                    else
                    {
                        var formatSeparatorIndex = span.IndexOf(':');
                        var indexSpan = formatSeparatorIndex == -1 ? span : span.Slice(0, formatSeparatorIndex);
                        argumentIndex = int.Parse(indexSpan);
                    }
                }
            }
        }


        public static bool IsCSharpKeyword(string? name)
        {
            switch (name)
            {
                case "abstract":
                case "add":
                case "alias":
                case "as":
                case "ascending":
                case "async":
                case "await":
                case "base":
                case "bool":
                case "break":
                case "by":
                case "byte":
                case "case":
                case "catch":
                case "char":
                case "checked":
                case "class":
                case "const":
                case "continue":
                case "decimal":
                case "default":
                case "delegate":
                case "descending":
                case "do":
                case "double":
                case "dynamic":
                case "else":
                case "enum":
                case "equals":
                case "event":
                case "explicit":
                case "extern":
                case "false":
                case "finally":
                case "fixed":
                case "float":
                case "for":
                case "foreach":
                case "from":
                case "get":
                case "global":
                case "goto":
                // `group` is a contextual to linq queries that we don't generate
                //case "group":
                case "if":
                case "implicit":
                case "in":
                case "int":
                case "interface":
                case "internal":
                case "into":
                case "is":
                case "join":
                case "let":
                case "lock":
                case "long":
                case "nameof":
                case "namespace":
                case "new":
                case "null":
                case "object":
                case "on":
                case "operator":
                // `orderby` is a contextual to linq queries that we don't generate
                //case "orderby":
                case "out":
                case "override":
                case "params":
                case "partial":
                case "private":
                case "protected":
                case "public":
                case "readonly":
                case "ref":
                case "remove":
                case "return":
                case "sbyte":
                case "sealed":
                // `select` is a contextual to linq queries that we don't generate
                // case "select":
                case "set":
                case "short":
                case "sizeof":
                case "stackalloc":
                case "static":
                case "string":
                case "struct":
                case "switch":
                case "this":
                case "throw":
                case "true":
                case "try":
                case "typeof":
                case "uint":
                case "ulong":
                case "unchecked":
                case "unmanaged":
                case "unsafe":
                case "ushort":
                case "using":
                // `value` is a contextual to getters that we don't generate
                // case "value":
                case "var":
                case "virtual":
                case "void":
                case "volatile":
                case "when":
                case "where":
                case "while":
                case "yield":
                    return true;
                default:
                    return false;
            }
        }

        /// <summary>
        /// Change a word to its plural form.
        /// Notice that this function will treat this word as a whole word instead of only changing the last word if it contains multiple words. Please use <see cref="LastWordToPlural(string, bool)"/> instead.
        /// </summary>
        /// <param name="single"></param>
        /// <param name="inputIsKnownToBeSingular"></param>
        /// <returns></returns>
        public static string ToPlural(this string single, bool inputIsKnownToBeSingular = true)
        {
            return single.Pluralize(inputIsKnownToBeSingular);
        }

        public static string LastWordToPlural(this string single, bool inputIsKnownToBeSingular = true)
        {
            var words = single.SplitByCamelCase();
            var lastWord = words.Last();
            var lastWordPlural = lastWord.ToPlural(inputIsKnownToBeSingular);
            if (inputIsKnownToBeSingular || lastWord != lastWordPlural)
            {
                return $"{string.Join("", words.SkipLast(1))}{lastWordPlural}";
            }
            return single;
        }

        /// <summary>
        /// Change a word to its singular form.
        /// Notice that this function will treat this word as a whole word instead of only changing the last word if it contains multiple words. Please use <see cref="LastWordToSingular(string, bool)"/> instead.
        /// </summary>
        /// <param name="plural"></param>
        /// <param name="inputIsKnownToBePlural"></param>
        /// <returns></returns>
        public static string ToSingular(this string plural, bool inputIsKnownToBePlural = true)
        {
            return plural.Singularize(inputIsKnownToBePlural);
        }

        public static string LastWordToSingular(this string plural, bool inputIsKnownToBePlural = true)
        {
            var words = plural.SplitByCamelCase();
            var lastWord = words.Last();
            var lastWordSingular = lastWord.ToSingular(inputIsKnownToBePlural);
            if (inputIsKnownToBePlural || lastWord != lastWordSingular)
            {
                return $"{string.Join("", words.SkipLast(1))}{lastWordSingular}";
            }
            return plural;
        }

        public static bool IsLastWordSingular(this string str)
        {
            return str == str.LastWordToSingular(false);
        }

        public static string FirstCharToLowerCase(this string str)
        {
            if (string.IsNullOrEmpty(str) || char.IsLower(str[0]))
                return str;

            return char.ToLower(str[0]) + str.Substring(1);
        }

        public static string FirstCharToUpperCase(this string str)
        {
            if (string.IsNullOrEmpty(str) || char.IsUpper(str[0]))
                return str;

            return char.ToUpper(str[0]) + str.Substring(1);
        }

        public static IEnumerable<string> SplitByCamelCase(this string camelCase)
        {
            return camelCase.Humanize().Split(' ').Select(w => w.FirstCharToUpperCase());
        }

        public static StringBuilder AppendIndentation(this StringBuilder builder, int indentation)
        {
            var indent = new string(' ', indentation);
            return builder.Append(indent);
        }

        //https://stackoverflow.com/a/8809437/294804
        public static string ReplaceFirst(this string text, string oldValue, string newValue)
        {
            var position = text.IndexOf(oldValue, StringComparison.Ordinal);
            return position < 0 ? text : text.Substring(0, position) + newValue + text.Substring(position + oldValue.Length);
        }

        public static string ReplaceLast(this string text, string oldValue, string newValue)
        {
            var position = text.LastIndexOf(oldValue, StringComparison.Ordinal);
            return position < 0 ? text : text.Substring(0, position) + newValue + text.Substring(position + oldValue.Length);
        }

        public static string RenameListToGet(this string methodName, string resourceName)
        {
            var newName = methodName;
            if (methodName.Equals("List") || methodName.Equals("ListAll") || methodName.StartsWith("ListBy"))
            {
                var pluralResourceName = resourceName.LastWordToPlural(inputIsKnownToBeSingular: false);
                var singularResourceName = resourceName.LastWordToSingular(inputIsKnownToBePlural: false);
                var getMethodPrefix = pluralResourceName == singularResourceName ? "GetAll" : "Get";
                var wordToBeReplaced = methodName.StartsWith("ListBy") ? "List" : methodName;
                newName = methodName.ReplaceFirst(wordToBeReplaced, $"{getMethodPrefix}{pluralResourceName}");
            }
            else if (methodName.StartsWith("List"))
            {
                var words = methodName.SplitByCamelCase();
                var getMethodPrefix = "Get";
                // Cases like ListEntitiesAssignedWithTerm is difficult to parse which noun should be plural and will just make no changes to the nouns for now.
                if (!words.Any(w => new HashSet<string> { "By", "With" }.Contains(w)))
                {
                    var pluralMethodName = methodName.LastWordToPlural(inputIsKnownToBeSingular: false);
                    var singularMethodName = methodName.LastWordToSingular(inputIsKnownToBePlural: false);
                    if (pluralMethodName == singularMethodName)
                    {
                        getMethodPrefix = "GetAll";
                    }
                    newName = pluralMethodName;
                }
                newName = newName.ReplaceFirst("List", getMethodPrefix);
                // For the next page method of List operations, Next is appended to the end of a List method and ListXXXNext will be renamed to GetXXXNexts. Here we need to check and fix this case by removing the "s" in the end.
                if (words.Last().Equals("Next", StringComparison.Ordinal))
                {
                    newName = newName.TrimEnd('s');
                }
            }
            return newName;
        }

        public static string RenameGetMethod(this string methodName, string resourceName)
        {
            if (methodName.Equals("Get"))
            {
                return $"Get{resourceName.LastWordToSingular(inputIsKnownToBePlural: false)}";
            }
            return methodName;
        }
    }
}
