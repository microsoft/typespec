// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

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
    }
}
