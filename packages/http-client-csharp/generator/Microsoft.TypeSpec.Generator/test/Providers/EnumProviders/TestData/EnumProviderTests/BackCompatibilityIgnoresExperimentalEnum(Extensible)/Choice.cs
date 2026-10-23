// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Sample.Models
{
    [System.Diagnostics.CodeAnalysis.Experimental("PREVIOUS001")]
    public readonly partial struct Choice
    {
        private readonly int _value;
        private const int PreviewValue = 42;
        private const int RemovedValue = 99;

        public Choice(int value)
        {
            _value = value;
        }

        public static Choice Preview { get; } = new Choice(PreviewValue);
        public static Choice Removed { get; } = new Choice(RemovedValue);
    }
}
