// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Sample.Models
{
    public enum Choice
    {
        [System.Diagnostics.CodeAnalysis.Experimental("PREVIOUS001")]
        Experimental = 1,
        Stable = 2
    }
}

namespace System.Diagnostics.CodeAnalysis
{
    internal sealed class ExperimentalAttribute : System.Attribute
    {
        public ExperimentalAttribute(string diagnosticId) { }
    }
}
