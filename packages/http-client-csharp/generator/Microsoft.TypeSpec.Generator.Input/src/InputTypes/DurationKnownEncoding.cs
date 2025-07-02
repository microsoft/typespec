// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    /// <summary>
    /// Defines known encoding formats for duration values.
    /// </summary>
    public enum DurationKnownEncoding
    {
        /// <summary>
        /// ISO 8601 duration format.
        /// </summary>
        Iso8601,
        /// <summary>
        /// Duration represented in seconds.
        /// </summary>
        Seconds,
        /// <summary>
        /// Constant duration value.
        /// </summary>
        Constant
    }
}
