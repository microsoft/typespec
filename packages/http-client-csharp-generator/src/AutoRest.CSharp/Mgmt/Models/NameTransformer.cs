// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Utilities;
using Microsoft.CodeAnalysis.CSharp;
using static AutoRest.CSharp.Input.MgmtConfiguration;

namespace AutoRest.CSharp.Mgmt.Models
{
    internal class NameTransformer
    {
        private record AppliedCache(NameInfo NewName, List<ApplyDetailStep> AppliedDetailSteps);
        public record ApplyDetailStep(string MappingKey, AcronymMappingTarget MappingValue, NameInfo NewName);

        private static NameTransformer? _instance;
        public static NameTransformer Instance => _instance ??= new NameTransformer(Configuration.MgmtConfiguration.AcronymMapping);

        private IReadOnlyDictionary<string, AcronymMappingTarget> _acronymMapping;
        private Regex _regex;
        private ConcurrentDictionary<string, AppliedCache> _wordCache;

        /// <summary>
        /// Instanciate a NameTransformer which uses the dictionary to transform the abbreviations in this word to correct casing
        /// </summary>
        /// <param name="acronymMapping"></param>
        internal NameTransformer(IReadOnlyDictionary<string, AcronymMappingTarget> acronymMapping)
        {
            _acronymMapping = acronymMapping;
            _regex = BuildRegex(acronymMapping.Keys);
            _wordCache = new ConcurrentDictionary<string, AppliedCache>();
        }

        private static Regex BuildRegex(IEnumerable<string> renameItems)
        {
            var regexRawString = string.Join("|", renameItems);
            // we are building the regex that matches
            // 1. it starts with a lower case letter or a digit which is considered as the end of its previous word
            //    or it is at the beginning of this string
            //    or we hit a word separator including \W, _, ., @, -, spaces
            // 2. it either should match one of the candidates in the rename rules dictionary
            // 3. it should followed by a upper case letter which is considered as the beginning of next word
            //    or it is the end of this string
            //    or we hit a word separator including \W, _, ., @, -, spaces
            return new Regex(@$"([\W|_|\.|@|-|\s|\$\da-z]|^)({regexRawString})([\W|_|\.|@|-|\s|\$A-Z]|$)");
        }

        /// <summary>
        /// Parse the input name and produce a name with correct casing
        /// </summary>
        /// <param name="name"></param>
        /// <returns></returns>
        public NameInfo EnsureNameCase(string name, Action<ApplyDetailStep>? onMappingApplied)
        {
            if (_wordCache.TryGetValue(name, out var result))
            {
                if (onMappingApplied != null)
                    result.AppliedDetailSteps.ForEach(record => onMappingApplied(record));
                return result.NewName;
            }

            // escape the following logic if we do not have any rules
            if (_acronymMapping.Count == 0)
            {
                result = new AppliedCache(
                    new NameInfo(name, name),
                    new List<ApplyDetailStep>());
                _wordCache.TryAdd(name, result);
                return result.NewName;
            }

            var propertyNameBuilder = new StringBuilder();
            var parameterNameBuilder = new StringBuilder();
            var strToMatch = name.FirstCharToUpperCase();
            var match = _regex.Match(strToMatch);
            var detailStep = new List<ApplyDetailStep>();
            bool hasFirstWord = false;
            while (match.Success)
            {
                // in our regular expression, the content we want to find is in the second group
                var matchGroup = match.Groups[2];
                var replaceValue = _acronymMapping[matchGroup.Value];
                // append everything between the beginning and the index of this match
                var everythingBeforeMatch = strToMatch.Substring(0, matchGroup.Index);
                // append everything before myself
                propertyNameBuilder.Append(everythingBeforeMatch);
                parameterNameBuilder.Append(everythingBeforeMatch);
                // append the replaced value
                propertyNameBuilder.Append(replaceValue.Value);
                // see if everything before myself is empty, or is all invalid character for an identifier which will be trimmed off, which makes the current word the first word
                if (!hasFirstWord && IsEquivelantEmpty(everythingBeforeMatch))
                {
                    hasFirstWord = true;
                    parameterNameBuilder.Append(replaceValue.ParameterValue ?? replaceValue.Value);
                }
                else
                    parameterNameBuilder.Append(replaceValue.Value);
                // move to whatever is left unmatched
                strToMatch = strToMatch.Substring(matchGroup.Index + matchGroup.Length);

                string tempPropertyName = propertyNameBuilder.ToString() + strToMatch;
                string tempParameterName = parameterNameBuilder.ToString() + strToMatch;
                NameInfo tempNameInfo = new NameInfo(tempPropertyName, tempParameterName);
                var step = new ApplyDetailStep(matchGroup.Value, replaceValue, tempNameInfo);
                if (onMappingApplied != null)
                    onMappingApplied(step);
                detailStep.Add(step);
                match = _regex.Match(strToMatch);
            }
            if (strToMatch.Length > 0)
            {
                propertyNameBuilder.Append(strToMatch);
                parameterNameBuilder.Append(strToMatch);
            }

            result = new AppliedCache(new NameInfo(propertyNameBuilder.ToString(), parameterNameBuilder.ToString()), detailStep);
            _wordCache.TryAdd(name, result);
            _wordCache.TryAdd(result.NewName.Name, result); // in some other scenarios we might need to use the property name as keys

            return result.NewName;
        }

        private static bool IsEquivelantEmpty(string s) => string.IsNullOrWhiteSpace(s) || s.All(c => !SyntaxFacts.IsIdentifierStartCharacter(c));

        internal record NameInfo(string Name, string VariableName);
    }
}
