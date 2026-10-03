// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    [CodeGenSuppress("PrivateIp")]
    public enum MockInputEnum
    {
        [CodeGenMember("Ip")]
        CustomIp = 1,
        Db = 2,
        [CodeGenMember("Os")]
        CustomOs = 3
    }
}
