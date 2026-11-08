// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    [CodeGenSuppress("IpValue")]
    public readonly partial struct Renamed
    {
        [CodeGenMember("Other")]
        private const int OS = 3;
        [CodeGenMember("Another")]
        public static Renamed IPv4Value { get; }
    }
}
