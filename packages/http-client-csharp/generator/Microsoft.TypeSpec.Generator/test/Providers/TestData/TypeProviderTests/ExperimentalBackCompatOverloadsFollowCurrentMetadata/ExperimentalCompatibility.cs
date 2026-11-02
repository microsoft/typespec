// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Diagnostics.CodeAnalysis;

namespace Test
{
    public class ExperimentalCompatibility
    {
        [Experimental("PREVIOUS001")]
        public void AddOptional(int value) { }

        [Experimental("PREVIOUS001")]
        public void RemoveNullability(int? value) { }

        [Experimental("PREVIOUS001")]
        public void RequireOptional(int? value = null) { }
    }
}
