// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace System.Diagnostics.CodeAnalysis
{
    [System.AttributeUsage(System.AttributeTargets.All)]
    internal sealed class ExperimentalAttribute : System.Attribute
    {
        public ExperimentalAttribute(string diagnosticId) { }
    }
}

namespace Sample
{
    [System.Diagnostics.CodeAnalysis.Experimental("TYPE001")]
    public class ExperimentalType
    {
        [System.Diagnostics.CodeAnalysis.Experimental("CTOR001")]
        public ExperimentalType() { }
    }

    public class StableType
    {
    }
}
