// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public readonly partial struct MockInputEnum
    {
        [CodeGenMember("Db")]
        public static MockInputEnum IP { get; } = new MockInputEnum(DbValue);
        [CodeGenMember("Other")]
        private const int OS = 3;
        [CodeGenMember("Another")]
        public static MockInputEnum IPv4Value { get; } = new MockInputEnum(4);
    }
}
