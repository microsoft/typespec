// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace System.Diagnostics.CodeAnalysis
{
    internal sealed class ExperimentalAttribute : System.Attribute
    {
        public ExperimentalAttribute(string diagnosticId) { }
    }
}

namespace Test
{
    [System.Diagnostics.CodeAnalysis.Experimental("PREVIOUS001")]
    public class ExperimentalType
    {
        public void DoWork(int value) { }
    }
}
