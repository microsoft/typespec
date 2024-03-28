// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace AutoRest.CSharp.Output.Models.Requests
{
    internal class DiagnosticAttribute
    {
        public DiagnosticAttribute(string name, ReferenceOrConstant value)
        {
            Name = name;
            Value = value;
        }

        public string Name { get; }
        public ReferenceOrConstant Value { get; }
    }
}
