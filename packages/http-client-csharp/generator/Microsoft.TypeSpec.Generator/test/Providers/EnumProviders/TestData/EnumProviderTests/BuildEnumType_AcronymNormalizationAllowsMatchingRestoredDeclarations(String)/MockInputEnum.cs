// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Sample.Models
{
    public readonly partial struct MockInputEnum
    {
        private const string IPValue = "published-ip";
        private const string DBValueValue = "published-db-value";
        private const string OSValue = "os";

        public static MockInputEnum IP { get; } = new MockInputEnum(IPValue);
        public static MockInputEnum DBValue { get; } = new MockInputEnum(DBValueValue);
        public static MockInputEnum OS { get; } = new MockInputEnum(OSValue);

        public MockInputEnum(string value) { }
    }
}
