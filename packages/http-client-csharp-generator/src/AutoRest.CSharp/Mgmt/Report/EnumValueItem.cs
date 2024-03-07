// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Text.Json.Serialization;
using YamlDotNet.Serialization;

namespace AutoRest.CSharp.Mgmt.Report
{
    internal class EnumValueItem : TransformableItem
    {
        public EnumValueItem(string name, string serializedName, TransformSection transformSection)
            :base(serializedName, transformSection)
        {
            Name = name;
        }

        [YamlIgnore]
        [JsonIgnore]
        public string Name { get; set; }
    }
}
