// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using AutoRest.CSharp.Output.Models.Serialization;
using AutoRest.CSharp.Output.Models.Shared;


namespace AutoRest.CSharp.Output.Models.Requests
{
    internal class RequestContentRequestBody : RequestBody
    {
        public Parameter Parameter { get; }

        public RequestContentRequestBody(Parameter parameter)
        {
            Parameter = parameter;
        }
    }
}
