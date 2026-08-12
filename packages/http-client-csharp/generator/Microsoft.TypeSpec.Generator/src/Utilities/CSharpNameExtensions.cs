// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.TypeSpec.Generator.Utilities
{
    internal static class CSharpNameExtensions
    {
        private static readonly (string Source, string Replacement)[] _acronymRenamingRules =
        [
            ("Ipv4", "IPv4"),
            ("Ipv6", "IPv6"),
            ("IpV4", "IPv4"),
            ("IpV6", "IPv6"),
            ("Ip", "IP"),
            ("Db", "DB"),
            ("Os", "OS")
        ];

        public static string NormalizeCSharpAcronyms(this string name)
        {
            char[]? normalizedName = null;
            for (int index = 0; index < name.Length - 1; index++)
            {
                foreach (var rule in _acronymRenamingRules)
                {
                    if (!name.AsSpan(index).StartsWith(rule.Source, StringComparison.Ordinal))
                    {
                        continue;
                    }

                    int boundaryIndex = index + rule.Source.Length;
                    if (boundaryIndex < name.Length && !char.IsUpper(name[boundaryIndex]))
                    {
                        continue;
                    }

                    normalizedName ??= name.ToCharArray();
                    rule.Replacement.CopyTo(0, normalizedName, index, rule.Replacement.Length);
                    index = boundaryIndex - 1;
                    break;
                }
            }

            return normalizedName is null ? name : new string(normalizedName);
        }
    }
}
