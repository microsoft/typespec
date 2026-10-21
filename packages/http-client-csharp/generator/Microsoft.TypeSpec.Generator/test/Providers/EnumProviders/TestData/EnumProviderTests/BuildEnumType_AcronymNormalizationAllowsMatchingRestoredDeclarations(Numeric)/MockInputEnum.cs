// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Sample.Models
{
    public readonly partial struct MockInputEnum
    {
        private const int IPValue = 1;
        private const int DBValueValue = 2;
        private const int OSValue = 3;

        public static MockInputEnum IP { get; } = new MockInputEnum(IPValue);
        public static MockInputEnum DBValue { get; } = new MockInputEnum(DBValueValue);
        public static MockInputEnum OS { get; } = new MockInputEnum(OSValue);

        public MockInputEnum(int value) { }
    }
}
