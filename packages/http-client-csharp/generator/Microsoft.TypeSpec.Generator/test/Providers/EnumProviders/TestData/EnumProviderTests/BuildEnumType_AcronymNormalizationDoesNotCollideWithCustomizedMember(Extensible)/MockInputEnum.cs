// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public readonly partial struct MockInputEnum
    {
        [CodeGenMember("Db")]
        public static MockInputEnum IP { get; } = new MockInputEnum(DbValue);
    }
}
