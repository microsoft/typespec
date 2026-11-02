// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Test
{
    [System.Diagnostics.CodeAnalysis.Experimental("PREVIOUS001")]
    public class ExperimentalType
    {
        public void DoWork(int value) { }
    }

    public class StableType
    {
        public void DoWork(int value) { }
    }

    [Unrelated.Experimental("PREVIOUS001")]
    public class UnrelatedExperimentalType
    {
        public void DoWork(int value) { }
    }
}

namespace Unrelated
{
    internal sealed class ExperimentalAttribute : System.Attribute
    {
        public ExperimentalAttribute(string diagnosticId) { }
    }
}
