// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public enum MockInputEnum
    {
        [CodeGenMember("IP")]
        CustomIp = 1,
        [CodeGenMember("IpV4")]
        CustomIpv4 = 4
    }
}
