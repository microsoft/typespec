// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Text.Json.Serialization;
using YamlDotNet.Serialization;

namespace AutoRest.CSharp.Mgmt.Report
{
    internal class ModelItem : TransformableItem
    {
        public ModelItem(string @namespace, string name, string serializedName, TransformSection transformSection)
            : base(serializedName, transformSection)
        {
            FullName = string.IsNullOrEmpty(@namespace) ? name : $"{@namespace}.{name}";
        }

        [YamlIgnore]
        [JsonIgnore]
        public string FullName { get; set; }

        public Dictionary<string, PropertyItem> Properties { get; set; } = new Dictionary<string, PropertyItem>();
    }
}
