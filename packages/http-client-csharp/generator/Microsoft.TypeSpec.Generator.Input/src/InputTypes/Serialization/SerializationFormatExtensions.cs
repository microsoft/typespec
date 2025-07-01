// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    /// <summary>
    /// Provides extension methods for <see cref="SerializationFormat"/> enumeration.
    /// </summary>
    public static class SerializationFormatExtensions
    {
        /// <summary>
        /// Converts a <see cref="SerializationFormat"/> to its corresponding format specifier string.
        /// </summary>
        /// <param name="format">The serialization format to convert.</param>
        /// <returns>A format specifier string for the given format, or <see langword="null"/> if no specifier is available.</returns>
        public static string? ToFormatSpecifier(this SerializationFormat format) => format switch
        {
            SerializationFormat.DateTime_RFC1123 => "R",
            SerializationFormat.DateTime_RFC3339 => "O",
            SerializationFormat.DateTime_RFC7231 => "R",
            SerializationFormat.DateTime_ISO8601 => "O",
            SerializationFormat.Date_ISO8601 => "D",
            SerializationFormat.DateTime_Unix => "U",
            SerializationFormat.Bytes_Base64Url => "U",
            SerializationFormat.Bytes_Base64 => "D",
            SerializationFormat.Duration_ISO8601 => "P",
            SerializationFormat.Duration_Constant => "c",
            SerializationFormat.Duration_Seconds => "%s",
            SerializationFormat.Duration_Seconds_Float => "s\\.FFF",
            SerializationFormat.Duration_Seconds_Double => "s\\.FFFFFF",
            SerializationFormat.Time_ISO8601 => "T",
            _ => null
        };
    }
}
