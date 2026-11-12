// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public readonly partial struct MockInputEnum
    {
        [CodeGenMember("IP")]
        public static MockInputEnum CustomIp { get; } = new MockInputEnum(IPValue);
        [CodeGenMember("IpV4")]
        public static MockInputEnum CustomIpv4 { get; } = new MockInputEnum(IpV4Value);
    }
}
