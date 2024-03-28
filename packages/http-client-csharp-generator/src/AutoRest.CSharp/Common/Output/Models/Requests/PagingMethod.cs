// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Linq;
using System.Collections.Generic;
using AutoRest.CSharp.Output.Models.Shared;

namespace AutoRest.CSharp.Output.Models.Requests
{
    internal class PagingMethod
    {
        public PagingMethod(RestClientMethod method, RestClientMethod? nextPageMethod, string name, Diagnostic diagnostics, PagingResponseInfo pagingResponse)
        {
            Method = method;
            NextPageMethod = nextPageMethod;
            Name = name;
            Diagnostics = diagnostics;
            PagingResponse = pagingResponse;
        }

        public string Name { get; }
        public RestClientMethod Method { get; }
        public RestClientMethod? NextPageMethod { get; }
        public PagingResponseInfo PagingResponse { get; }
        public Diagnostic Diagnostics { get; }
        public string Accessibility => "public";

        /// <summary>
        /// Check whether the given parameter name is like page size
        /// </summary>
        /// <param name="name">Parameter name to check</param>
        /// <returns></returns>
        public static bool IsPageSizeName(string name)
        {
            var n = name.ToLower();
            return (n.EndsWith("pagesize") || n.EndsWith("page_size"));
        }

        public static bool IsPageSizeType(Type type) => Type.GetTypeCode(type) switch
        {
            TypeCode.Single => true,
            TypeCode.Double => true,
            TypeCode.Decimal => true,
            TypeCode.Int64 => true,
            TypeCode.Int32 => true,
            _ => false
        };

        /// <summary>
        /// Check whether the given parameter is a page size parameter
        /// </summary>
        /// <param name="p">Parameter to check</param>
        /// <returns>true if the given parameter is a page size parameter; otherwise false</returns>
        public static bool IsPageSizeParameter(Parameter p)
        {
            return IsPageSizeName(p.Name) && IsPageSizeType(p.Type.FrameworkType);
        }
    }
}
