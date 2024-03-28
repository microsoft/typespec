// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

namespace AutoRest.CSharp.Output.Models.Responses
{
    internal class Response
    {
        public Response(ResponseBody? responseBody, StatusCodes[] statusCodes)
        {
            ResponseBody = responseBody;
            StatusCodes = statusCodes;
        }

        public ResponseBody? ResponseBody { get; }
        public StatusCodes[] StatusCodes { get; }
    }
}
