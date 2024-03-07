// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Reflection.Metadata;

namespace AutoRest.CSharp.Output.Models.Requests
{
    internal class MultipartRequestBody : RequestBody
    {
        public MultipartRequestBodyPart[] RequestBodyParts { get; }

        public MultipartRequestBody(MultipartRequestBodyPart[] requestBodyParts)
        {
            RequestBodyParts = requestBodyParts;
        }
    }
}
