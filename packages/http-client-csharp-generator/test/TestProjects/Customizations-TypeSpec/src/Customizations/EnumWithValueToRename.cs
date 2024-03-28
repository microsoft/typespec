// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Azure.Core;

namespace CustomizationsInTsp.Models
{
    /// <summary> Enum with renamed value (original name: ValueToRename). </summary>
    public enum EnumWithValueToRename
    {
        /// <summary> 1. </summary>
        One,
        /// <summary> 2. </summary>
        Two,
        /// <summary> 3. </summary>
        [CodeGenMember("ValueToRename")]
        Three
    }
}
