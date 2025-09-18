// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Diagnostics.CodeAnalysis;

namespace Microsoft.TypeSpec.Generator.Input.Extensions
{
    internal static class DurationKnownEncodingExtensions
    {
        public static bool TryParse(string? value, [NotNullWhen(true)] out DurationKnownEncoding? result)
        {
            result = value?.ToLowerInvariant() switch
            {
                "iso8601" => DurationKnownEncoding.Iso8601,
                "seconds" => DurationKnownEncoding.Seconds,
                "milliseconds" => DurationKnownEncoding.Milliseconds,
                "duration-constant" => DurationKnownEncoding.Constant,
                _ => null
            };

            return result.HasValue;
        }
    }
}
