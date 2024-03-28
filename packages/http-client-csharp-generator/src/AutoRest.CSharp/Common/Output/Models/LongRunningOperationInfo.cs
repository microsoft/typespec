// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Diagnostics.CodeAnalysis;
using AutoRest.CSharp.Output.Models.Requests;

namespace AutoRest.CSharp.Common.Output.Models
{
    internal class LongRunningOperationInfo
    {
        public LongRunningOperationInfo(string accessibility, string clientPrefix, RestClientMethod? nextOperationMethod)
        {
            Accessibility = accessibility;
            ClientPrefix = clientPrefix;
            NextOperationMethod = nextOperationMethod;
        }

        public string Accessibility { get; }

        public string ClientPrefix { get; }

        public RestClientMethod? NextOperationMethod { get; }

    }
}
