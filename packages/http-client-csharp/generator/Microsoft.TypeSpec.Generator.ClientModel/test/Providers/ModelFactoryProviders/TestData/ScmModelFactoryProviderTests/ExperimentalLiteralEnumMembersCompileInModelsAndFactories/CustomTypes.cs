// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Diagnostics.CodeAnalysis;

namespace Sample.Models
{
    public partial class Payload
    {
#pragma warning disable SAMPLE_MEMBER
        public Choice Kind { get; } = Choice.One;
#pragma warning restore SAMPLE_MEMBER
    }

    public enum Choice
    {
        [Experimental("SAMPLE_MEMBER")]
        One,
        [Experimental("OTHER_MEMBER")]
        Two
    }
}
