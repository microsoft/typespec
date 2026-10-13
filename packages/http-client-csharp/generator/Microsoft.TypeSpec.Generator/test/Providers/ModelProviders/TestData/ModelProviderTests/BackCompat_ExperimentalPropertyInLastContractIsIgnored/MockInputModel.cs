// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Sample.Models
{
    public class MockInputModel
    {
        [System.Diagnostics.CodeAnalysis.Experimental("PREVIOUS001")]
        public string Count { get; set; }
    }
}

namespace System.Diagnostics.CodeAnalysis
{
    internal sealed class ExperimentalAttribute : System.Attribute
    {
        public ExperimentalAttribute(string diagnosticId) { }
    }
}
