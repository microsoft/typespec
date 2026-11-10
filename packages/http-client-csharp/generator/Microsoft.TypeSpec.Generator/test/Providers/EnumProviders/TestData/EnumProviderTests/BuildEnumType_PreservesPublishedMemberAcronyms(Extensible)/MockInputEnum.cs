// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Sample.Models
{
    public readonly partial struct MockInputEnum
    {
        private const int IpValue = 1;
        private const int DbValue = 2;
        private const int OsValue = 3;
        private const int Ipv4Value = 4;
        private const int IpV6Value = 6;
        private const int IpUriValue = 7;

        public static MockInputEnum Ip { get; } = new MockInputEnum(IpValue);
        public static MockInputEnum Db { get; } = new MockInputEnum(DbValue);
        public static MockInputEnum Os { get; } = new MockInputEnum(OsValue);
        public static MockInputEnum Ipv4 { get; } = new MockInputEnum(Ipv4Value);
        public static MockInputEnum IpV6 { get; } = new MockInputEnum(IpV6Value);
        public static MockInputEnum IpUri { get; } = new MockInputEnum(IpUriValue);

        public MockInputEnum(int value) { }
    }
}
