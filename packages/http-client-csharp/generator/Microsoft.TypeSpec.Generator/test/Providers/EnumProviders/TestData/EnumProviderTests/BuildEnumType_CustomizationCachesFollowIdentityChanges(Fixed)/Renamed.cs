// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    [CodeGenSuppress("Ip")]
    public enum Renamed
    {
        [CodeGenMember("Other")]
        OS = 3,
        [CodeGenMember("Another")]
        IPv4 = 4
    }
}
