// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    /// <summary>
    /// Defines known encoding formats for date and time values.
    /// </summary>
    public enum DateTimeKnownEncoding
    {
        /// <summary>
        /// DateTime formatted according to RFC 3339.
        /// </summary>
        Rfc3339,
        /// <summary>
        /// DateTime formatted according to RFC 7231.
        /// </summary>
        Rfc7231,
        /// <summary>
        /// DateTime represented as Unix timestamp.
        /// </summary>
        UnixTimestamp
    }
}
