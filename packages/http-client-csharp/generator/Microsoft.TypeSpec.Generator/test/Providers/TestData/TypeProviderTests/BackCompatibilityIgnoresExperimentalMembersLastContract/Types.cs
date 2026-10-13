// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Test
{
    public abstract class ExperimentalMembersType
    {
        public ExperimentalMembersType() { }

        [System.Diagnostics.CodeAnalysis.Experimental("PREVIOUS001")]
        public ExperimentalMembersType(int value) { }

        [System.Diagnostics.CodeAnalysis.Experimental("PREVIOUS001")]
        public int ExperimentalProperty { get; set; }

        public int StableProperty { get; set; }

        [System.Diagnostics.CodeAnalysis.Experimental("PREVIOUS001")]
        public const int ExperimentalField = 1;

        [System.Diagnostics.CodeAnalysis.Experimental("PREVIOUS001")]
        public void ExperimentalMethod() { }

        public void StableMethod() { }
    }
}

namespace System.Diagnostics.CodeAnalysis
{
    internal sealed class ExperimentalAttribute : System.Attribute
    {
        public ExperimentalAttribute(string diagnosticId) { }
    }
}
