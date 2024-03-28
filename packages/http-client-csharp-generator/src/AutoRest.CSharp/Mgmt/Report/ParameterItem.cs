// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Output.Models.Shared;
using YamlDotNet.Serialization;

namespace AutoRest.CSharp.Mgmt.Report
{
    internal class ParameterItem : TransformableItem
    {
        public ParameterItem(Parameter parameter, string paramFullSerializedName, TransformSection transformSection)
            : base(paramFullSerializedName, transformSection)
        {
            this.Name = parameter.Name;
            this.Type = parameter.Type.GetNameForReport();
        }

        public string Name { get; set; }
        public string Type { get; set; }
    }
}
