// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using AutoRest.CSharp.Input;
using Azure.Core;

namespace AutoRest.CSharp.Utilities
{
    internal static class AzureCoreExtensions
    {
        public static string ToRequestMethodName(this RequestMethod method) => method.ToString() switch
        {
            "GET" => nameof(RequestMethod.Get),
            "POST" => nameof(RequestMethod.Post),
            "PUT" => nameof(RequestMethod.Put),
            "PATCH" => nameof(RequestMethod.Patch),
            "DELETE" => nameof(RequestMethod.Delete),
            "HEAD" => nameof(RequestMethod.Head),
            "OPTIONS" => nameof(RequestMethod.Options),
            "TRACE" => nameof(RequestMethod.Trace),
            _ => String.Empty
        };

        public static RequestMethod ToCoreRequestMethod(this HttpMethod method) => method switch
        {
            HttpMethod.Delete => RequestMethod.Delete,
            HttpMethod.Get => RequestMethod.Get,
            HttpMethod.Head => RequestMethod.Head,
            HttpMethod.Options => RequestMethod.Options,
            HttpMethod.Patch => RequestMethod.Patch,
            HttpMethod.Post => RequestMethod.Post,
            HttpMethod.Put => RequestMethod.Put,
            HttpMethod.Trace => RequestMethod.Trace,
            _ => RequestMethod.Get
        };
    }
}
