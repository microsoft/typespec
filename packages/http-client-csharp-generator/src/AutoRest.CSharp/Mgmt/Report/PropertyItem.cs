// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Text.Json.Serialization;
using YamlDotNet.Serialization;

namespace AutoRest.CSharp.Mgmt.Report
{
    internal class PropertyItem : TransformableItem
    {
        public PropertyItem(string name, string type, string serializedName, TransformSection transformSection)
            :base(serializedName, transformSection)
        {
            Name = name;
            Type = type;
        }

        [YamlIgnore]
        [JsonIgnore]
        public string Name { get; set; }
        public string Type { get; set; }
    }
}
