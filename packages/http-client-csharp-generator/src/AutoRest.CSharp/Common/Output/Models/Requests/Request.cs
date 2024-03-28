// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Linq;
using System.Collections.Generic;
using Azure.Core;

namespace AutoRest.CSharp.Output.Models.Requests
{
    internal class Request
    {
        public Request(RequestMethod httpMethod, PathSegment[] pathSegments, QueryParameter[] query, RequestHeader[] headers, RequestBody? body)
        {
            HttpMethod = httpMethod;
            PathSegments = pathSegments;
            Query = query;
            Headers = headers;
            Body = body;
        }

        public RequestMethod HttpMethod { get; }
        public PathSegment[] PathSegments { get; }
        public QueryParameter[] Query { get; }
        public RequestHeader[] Headers { get; }
        public RequestBody? Body { get; }
    }
}
