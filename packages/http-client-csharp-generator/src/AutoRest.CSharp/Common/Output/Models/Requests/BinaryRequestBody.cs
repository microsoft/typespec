// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace AutoRest.CSharp.Output.Models.Requests
{
    internal class BinaryRequestBody : RequestBody
    {
        public ReferenceOrConstant Value { get; }

        public BinaryRequestBody(ReferenceOrConstant value)
        {
            Value = value;
        }
    }
}
