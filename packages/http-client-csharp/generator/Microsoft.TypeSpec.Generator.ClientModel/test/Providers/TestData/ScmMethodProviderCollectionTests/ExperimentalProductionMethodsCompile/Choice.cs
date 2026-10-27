// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Diagnostics.CodeAnalysis;

namespace Sample.Models
{
    public readonly partial struct Choice
    {
        [Experimental("B")]
        public override string ToString() => _value;
    }

    [Experimental("A")]
    public partial class Payload
    {
    }
}

namespace Sample
{
    public partial class SampleContext
    {
        public static SampleContext Default { get; } = new SampleContext();
    }
}
