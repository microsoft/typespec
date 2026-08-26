// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    /// <summary>
    /// Represents the known encoding formats for arrays.
    /// </summary>
    public enum ArrayKnownEncoding
    {
        /// <summary>
        /// Comma-delimited array encoding
        /// </summary>
        CommaDelimited,

        /// <summary>
        /// Space-delimited array encoding
        /// </summary>
        SpaceDelimited,

        /// <summary>
        /// Pipe-delimited array encoding
        /// </summary>
        PipeDelimited,

        /// <summary>
        /// Newline-delimited array encoding
        /// </summary>
        NewlineDelimited
    }
}
