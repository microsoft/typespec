// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

namespace AutoRest.CSharp.Output.Models.Serialization
{
    internal enum SerializationFormat
    {
        Default,
        DateTime_RFC1123,
        DateTime_RFC3339,
        DateTime_RFC7231,
        DateTime_ISO8601,
        DateTime_Unix,
        Date_ISO8601,
        Duration_ISO8601,
        Duration_Constant,
        Duration_Seconds,
        Duration_Seconds_Float,
        Time_ISO8601,
        Bytes_Base64Url,
        Bytes_Base64
    }
}
