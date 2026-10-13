// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Sample.Models
{
    public readonly struct Choice
    {
        [System.Diagnostics.CodeAnalysis.Experimental("PREVIOUS001")]
        public static Choice Experimental => default;

        public static Choice Stable => default;

        private const string ExperimentalValue = "experimental";
        private const string StableValue = "stable";
    }
}

namespace System.Diagnostics.CodeAnalysis
{
    internal sealed class ExperimentalAttribute : System.Attribute
    {
        public ExperimentalAttribute(string diagnosticId) { }
    }
}
