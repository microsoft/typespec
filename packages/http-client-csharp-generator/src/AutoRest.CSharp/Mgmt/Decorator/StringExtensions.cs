// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Utilities;

namespace AutoRest.CSharp.Mgmt.Decorator
{
    internal static class StringExtensions
    {
        private const string ResourceSuffix = "Resource";
        private static HashSet<char> _vowels = new HashSet<char>(new char[] { 'a', 'e', 'i', 'o', 'u' });

        // words in propery which we do not want to split
        private static string[][] PropertyGroupWords = new string[][]
        {
            new string[] { "Extended", "Location" },
            new string[] { "Resource", "Type" },
            new string[] { "Virtual", "Machine" },
        };
        private static WordTrieNode? PropertyGroupWordsRootTrieNode;

        /// <summary>
        /// This function changes a resource name to its plural form. If it has the same plural and singular form, it will add "All" prefix before the resource name.
        /// </summary>
        /// <param name="resourceName"></param>
        /// <returns></returns>
        public static string ResourceNameToPlural(this string resourceName)
        {
            var pluralResourceName = resourceName.LastWordToPlural(false);
            return pluralResourceName != resourceName ?
                pluralResourceName :
                $"All{resourceName}";
        }

        /// <summary>
        /// Add `Resource` suffix to a resource name if that resource doesn't end with `Resource`.
        /// </summary>
        /// <param name="resourceName"></param>
        /// <returns></returns>
        public static string AddResourceSuffixToResourceName(this string resourceName)
        {
            return resourceName.EndsWith(ResourceSuffix) ? resourceName : resourceName + ResourceSuffix;
        }

        public static bool StartsWithVowel(this string resourceName)
        {
            return !string.IsNullOrEmpty(resourceName) && _vowels.Contains(char.ToLower(resourceName[0]));
        }

        public static IEnumerable<string> SplitByCamelCaseAndGroup(this string camelCase)
        {
            var words = camelCase.SplitByCamelCase().ToList();
            var i = 0;
            while (i < words.Count)
            {
                if (TryToFindGroup(words.TakeLast(words.Count - i), out var groupWords))
                {
                    var newWord = string.Join("", groupWords);
                    words[i] = newWord;
                    words.RemoveRange(i + 1, groupWords.Count() - 1);
                }
                i++;
            }
            return words;
        }

        private static bool TryToFindGroup(IEnumerable<string> words, out IEnumerable<string> groupWords)
        {
            if (PropertyGroupWordsRootTrieNode == null)
            {
                PropertyGroupWordsRootTrieNode = new WordTrieNode();
                foreach (var propertyGroupWords in PropertyGroupWords)
                {
                    PropertyGroupWordsRootTrieNode.Save(propertyGroupWords);
                }
            }
            groupWords = PropertyGroupWordsRootTrieNode.GetLongestPrefixes(words);
            return (groupWords.Count() > 0);
        }

        private class WordTrieNode
        {
            public Dictionary<string, WordTrieNode> children = new Dictionary<string, WordTrieNode>();

            public void Save(IEnumerable<string> words)
            {
                if (words.Count() == 0)
                {
                    return;
                }

                var firstWord = words.First();
                if (!children.TryGetValue(firstWord, out var child))
                {
                    child = new WordTrieNode();
                    children[firstWord] = child;
                }
                child.Save(words.TakeLast(words.Count() - 1).ToList());
            }

            public IEnumerable<string> GetLongestPrefixes(IEnumerable<string> words)
            {
                var prefixes = new List<string>();

                if (words.Count() == 0)
                {
                    return prefixes;
                }

                var firstWord = words.First();
                if (children.TryGetValue(firstWord, out var child))
                {
                    prefixes.Add(firstWord);
                    prefixes.AddRange(child.GetLongestPrefixes(words.TakeLast(words.Count() - 1)));
                }
                return prefixes;
            }
        }
    }
}
