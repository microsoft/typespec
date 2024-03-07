// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Output.Models.Shared;

namespace AutoRest.CSharp.Output.Models.Requests
{
    internal class LongRunningOperationMethod
    {
        public LongRunningOperationMethod(string name, LongRunningOperation operation, RestClientMethod startMethod, Diagnostic diagnostics)
        {
            Operation = operation;
            StartMethod = startMethod;
            Diagnostics = diagnostics;
            Name = name;
        }

        public string Name { get; }
        public LongRunningOperation Operation { get; }

        public RestClientMethod StartMethod { get; }

        public Diagnostic Diagnostics { get; }
        public string Accessibility => "public";
    }
}
