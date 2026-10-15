// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    [CodeGenSuppress("PrivateIp")]
    public readonly partial struct MockInputEnum
    {
        [CodeGenMember("Ip")]
        public static MockInputEnum CustomIp { get; } = new MockInputEnum(IpValue);
        public static MockInputEnum Db { get; } = new MockInputEnum(DbValue);
        [CodeGenMember("Os")]
        public static MockInputEnum CustomOs { get; } = new MockInputEnum(OsValue);
        private const int Ipv4Value = 4;
    }
}
