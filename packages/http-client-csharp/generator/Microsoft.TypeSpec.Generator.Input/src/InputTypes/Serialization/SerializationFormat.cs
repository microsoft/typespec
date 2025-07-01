// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    // TODO: This enum should be removed, see https://github.com/microsoft/typespec/issues/4228
    /// <summary>
    /// Represents the set of known serialization formats.
    /// </summary>
    public enum SerializationFormat
    {
        /// <summary>
        /// Default serialization format.
        /// </summary>
        Default,
        /// <summary>
        /// DateTime formatted according to RFC 1123.
        /// </summary>
        DateTime_RFC1123,
        /// <summary>
        /// DateTime formatted according to RFC 3339.
        /// </summary>
        DateTime_RFC3339,
        /// <summary>
        /// DateTime formatted according to RFC 7231.
        /// </summary>
        DateTime_RFC7231,
        /// <summary>
        /// DateTime formatted according to ISO 8601.
        /// </summary>
        DateTime_ISO8601,
        /// <summary>
        /// DateTime formatted as Unix timestamp.
        /// </summary>
        DateTime_Unix,
        /// <summary>
        /// Date formatted according to ISO 8601.
        /// </summary>
        Date_ISO8601,
        /// <summary>
        /// Duration formatted according to ISO 8601.
        /// </summary>
        Duration_ISO8601,
        /// <summary>
        /// Duration as a constant value.
        /// </summary>
        Duration_Constant,
        /// <summary>
        /// Duration represented in seconds.
        /// </summary>
        Duration_Seconds,
        /// <summary>
        /// Duration represented in seconds as a float.
        /// </summary>
        Duration_Seconds_Float,
        /// <summary>
        /// Duration represented in seconds as a double.
        /// </summary>
        Duration_Seconds_Double,
        /// <summary>
        /// Time formatted according to ISO 8601.
        /// </summary>
        Time_ISO8601,
        /// <summary>
        /// Bytes encoded as Base64 URL.
        /// </summary>
        Bytes_Base64Url,
        /// <summary>
        /// Bytes encoded as Base64.
        /// </summary>
        Bytes_Base64,
        /// <summary>
        /// Integer represented as a string.
        /// </summary>
        Int_String,
    }
}
