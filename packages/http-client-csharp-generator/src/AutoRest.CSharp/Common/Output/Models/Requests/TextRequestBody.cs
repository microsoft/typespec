// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

namespace AutoRest.CSharp.Output.Models.Requests
{
    internal class TextRequestBody : RequestBody
    {
        public ReferenceOrConstant Value { get; }

        public TextRequestBody(ReferenceOrConstant value)
        {
            Value = value;
        }
    }
}
