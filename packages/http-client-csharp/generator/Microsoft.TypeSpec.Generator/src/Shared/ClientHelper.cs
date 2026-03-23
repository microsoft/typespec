// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Input;

namespace Microsoft.TypeSpec.Generator.Shared
{
    internal static class ClientHelper
    {
        /// <summary>
        /// Builds a name with the specified prefix and suffix, ensuring no duplicate prefix or suffix
        /// if the namespace/service segment already contains them.
        /// </summary>
        /// <param name="serviceName">The full service name.</param>
        /// <param name="prefix">The prefix to ensure (e.g., "Service", "Latest").</param>
        /// <param name="suffix">The suffix to ensure (e.g., "Version").</param>
        /// <returns>A name with the specified prefix and suffix.</returns>
        public static string BuildNameForService(string serviceName, string prefix, string suffix)
        {
            var lastNamespaceSegment = serviceName.AsSpan();
            int lastDotIndex = serviceName.LastIndexOf('.');
            if (lastDotIndex >= 0)
            {
                lastNamespaceSegment = lastNamespaceSegment.Slice(lastDotIndex + 1);
            }

            bool hasPrefix = lastNamespaceSegment.StartsWith(prefix.AsSpan(), StringComparison.OrdinalIgnoreCase);
            bool hasSuffix = lastNamespaceSegment.EndsWith(suffix.AsSpan(), StringComparison.OrdinalIgnoreCase);

            return (hasPrefix, hasSuffix) switch
            {
                (true, true) => lastNamespaceSegment.ToString(),
                (true, false) => $"{lastNamespaceSegment}{suffix}",
                (false, true) => $"{prefix}{lastNamespaceSegment}",
                (false, false) => $"{prefix}{lastNamespaceSegment}{suffix}"
            };
        }

        /// <summary>
        /// Extracts the last segment of a dotted namespace.
        /// </summary>
        /// <param name="ns">The full namespace (e.g., "Sample.KeyVault").</param>
        /// <returns>The last segment (e.g., "KeyVault"), or the input if there is no dot.</returns>
        public static string GetLastNamespaceSegment(string ns)
        {
            int lastDot = ns.LastIndexOf('.');
            return lastDot >= 0 ? ns.Substring(lastDot + 1) : ns;
        }

        /// <summary>
        /// Determines whether the last namespace segment of the given service namespace
        /// collides with any other enum's last namespace segment in the collection.
        /// </summary>
        /// <param name="serviceNamespace">The namespace to check for collisions.</param>
        /// <param name="currentEnum">The current enum to exclude from the comparison.</param>
        /// <param name="apiVersionEnums">All API version enums to compare against.</param>
        /// <returns>True if another enum has the same last namespace segment.</returns>
        public static bool HasLastSegmentCollision(string serviceNamespace, InputEnumType currentEnum, IEnumerable<InputEnumType> apiVersionEnums)
        {
            var lastSegment = GetLastNamespaceSegment(serviceNamespace);
            return apiVersionEnums.Any(e =>
                e != currentEnum &&
                !string.IsNullOrEmpty(e.Namespace) &&
                string.Equals(GetLastNamespaceSegment(e.Namespace), lastSegment, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Finds the shortest unique namespace suffix for the given enum among all API version enums,
        /// by progressively adding segments from right to left until the suffix is unique.
        /// If all segments are exhausted and the suffix is still not unique (same namespace),
        /// the enum's input name is appended for disambiguation.
        /// </summary>
        /// <param name="serviceNamespace">The full namespace of the current enum.</param>
        /// <param name="currentEnum">The current enum to exclude from the comparison.</param>
        /// <param name="apiVersionEnums">All API version enums to compare against.</param>
        /// <returns>
        /// The shortest unique namespace suffix string (e.g., "ServiceOne.Tests" from "Azure.ServiceOne.Tests"),
        /// or the full namespace plus the enum's input name if the namespace itself is not unique.
        /// </returns>
        public static string GetShortestUniqueNamespacePrefix(string serviceNamespace, InputEnumType currentEnum, IEnumerable<InputEnumType> apiVersionEnums)
        {
            var otherNamespaces = apiVersionEnums
                .Where(e => e != currentEnum && !string.IsNullOrEmpty(e.Namespace))
                .Select(e => e.Namespace!)
                .ToList();

            string[] segments = serviceNamespace.Split('.');

            // Start from the last segment and progressively prepend segments
            for (int count = 1; count <= segments.Length; count++)
            {
                string candidate = string.Join(".", segments, segments.Length - count, count);
                bool isUnique = true;
                foreach (var otherNs in otherNamespaces)
                {
                    string[] otherSegments = otherNs.Split('.');
                    int otherCount = Math.Min(count, otherSegments.Length);
                    string otherCandidate = string.Join(".", otherSegments, otherSegments.Length - otherCount, otherCount);
                    if (string.Equals(candidate, otherCandidate, StringComparison.OrdinalIgnoreCase))
                    {
                        isUnique = false;
                        break;
                    }
                }
                if (isUnique)
                {
                    return candidate;
                }
            }

            // Full namespace still collides (identical namespaces) — append enum input name
            return $"{serviceNamespace}.{currentEnum.Name}";
        }
    }
}
