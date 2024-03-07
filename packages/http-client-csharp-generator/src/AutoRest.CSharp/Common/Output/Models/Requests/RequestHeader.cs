// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using AutoRest.CSharp.Output.Models.Serialization;

namespace AutoRest.CSharp.Output.Models.Requests
{
    internal class RequestHeader
    {
        private static HashSet<string> ContentHeaders = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Allow",
            "Content-Disposition",
            "Content-Encoding",
            "Content-Language",
            "Content-Length",
            "Content-Location",
            "Content-MD5",
            "Content-Range",
            "Content-Type",
            "Expires",
            "Last-Modified",
        };

        public const string RepeatabilityRequestId = "Repeatability-Request-ID";
        public const string RepeatabilityFirstSent = "Repeatability-First-Sent";

        public static HashSet<string> RepeatabilityRequestHeaders = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            RepeatabilityRequestId,
            RepeatabilityFirstSent,
        };
        public static bool IsRepeatabilityRequestHeader(string headerName) => RepeatabilityRequestHeaders.Contains(headerName);

        public static HashSet<string> ClientRequestIdHeaders = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "client-request-id",
        };

        public static HashSet<string> ReturnClientRequestIdResponseHeaders = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "return-client-request-id",
        };

        public static bool IsClientRequestIdHeader(string headerName) => ClientRequestIdHeaders.Contains(headerName) || ReturnClientRequestIdResponseHeaders.Contains(headerName);

        public string Name { get; }
        public ReferenceOrConstant Value { get; }
        public string? Delimiter { get; }
        public SerializationFormat Format { get; }
        public bool IsContentHeader { get; }

        public RequestHeader(string name, ReferenceOrConstant value, string? delimiter, SerializationFormat format = SerializationFormat.Default)
        {
            Name = name;
            Value = value;
            Format = format;
            Delimiter = delimiter;
            IsContentHeader = ContentHeaders.Contains(name);
        }
    }
}
