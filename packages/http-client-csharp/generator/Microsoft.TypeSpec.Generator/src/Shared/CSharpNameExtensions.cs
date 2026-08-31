// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.TypeSpec.Generator.Utilities
{
    internal static class CSharpNameExtensions
    {
        /// <summary>
        /// Gets the normalized semantic stem of a date-time name by removing its recognized suffix.
        /// </summary>
        public static string? GetDateTimeStem(this string name)
        {
            var suffixLength = DateTimeNameRules.GetSuffixLength(name);
            return suffixLength == 0 || suffixLength == name.Length
                ? null
                : DateTimeNameRules.ToVerbForm(name[..^suffixLength]);
        }

        private static class DateTimeNameRules
        {
            private const string AtSuffix = "At";
            private const string DateSuffix = "Date";
            private const string DateTimeSuffix = "DateTime";
            private const string OnSuffix = "On";
            private const string TimeStampSuffix = "TimeStamp";
            private const string TimeSuffix = "Time";
            private const string TimestampSuffix = "Timestamp";

            // Complete prefixes that read better as verbs when combined with the "On" suffix. Keep the
            // collection ordered so adding overlapping suffixes in the future cannot make compound matching
            // depend on dictionary enumeration order.
            private static readonly (string Noun, string Verb)[] _nounToVerbRules =
            [
                ("Change", "Changed"),
                ("Creation", "Created"),
                ("Deletion", "Deleted"),
                ("End", "Ends"),
                ("Expiration", "Expires"),
                ("Expire", "Expires"),
                ("Modification", "Modified"),
                ("Start", "Starts")
            ];

            internal static string ToVerbForm(string prefix)
            {
                // Resolve all exact rules before considering compound suffixes so an overlapping rule added
                // later cannot be preempted by an earlier compound match.
                foreach (var (noun, verb) in _nounToVerbRules)
                {
                    if (prefix.Equals(noun, StringComparison.OrdinalIgnoreCase))
                    {
                        return char.IsLower(prefix[0])
                            ? char.ToLowerInvariant(verb[0]) + verb[1..]
                            : verb;
                    }
                }

                foreach (var (noun, compoundVerb) in _nounToVerbRules)
                {
                    if (prefix.Length > noun.Length &&
                        prefix.EndsWith(noun, StringComparison.OrdinalIgnoreCase) &&
                        char.IsUpper(prefix[^noun.Length]))
                    {
                        return prefix[..^noun.Length] + compoundVerb;
                    }
                }

                return prefix;
            }

            internal static int GetSuffixLength(string name)
            {
                if (name.EndsWith(TimestampSuffix, StringComparison.Ordinal) ||
                    name.EndsWith(TimeStampSuffix, StringComparison.Ordinal) ||
                    name.Equals(TimestampSuffix, StringComparison.OrdinalIgnoreCase))
                {
                    return TimestampSuffix.Length;
                }

                if (name.Length > DateTimeSuffix.Length && name.EndsWith(DateTimeSuffix, StringComparison.Ordinal))
                {
                    return DateTimeSuffix.Length;
                }

                if (name.Length > TimeSuffix.Length && name.EndsWith(TimeSuffix, StringComparison.Ordinal))
                {
                    return TimeSuffix.Length;
                }

                if (name.Equals(DateSuffix, StringComparison.OrdinalIgnoreCase) ||
                    name.EndsWith(DateSuffix, StringComparison.Ordinal))
                {
                    return DateSuffix.Length;
                }

                if (name.Length > OnSuffix.Length && name.EndsWith(OnSuffix, StringComparison.Ordinal))
                {
                    return OnSuffix.Length;
                }

                return name.Length > AtSuffix.Length && name.EndsWith(AtSuffix, StringComparison.Ordinal)
                    ? AtSuffix.Length
                    : 0;
            }
        }
    }
}
