// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using AutoRest.CSharp.Mgmt.Decorator;
using AutoRest.CSharp.Mgmt.Output;
using YamlDotNet.Serialization;

namespace AutoRest.CSharp.Mgmt.Report
{
    internal class ResourceItem : TransformableItem
    {
        public ResourceItem(Resource resource, TransformSection transformSection)
            :base(resource.ResourceName, transformSection)
        {
            this.Name = resource.ResourceName;
            this.ContextPaths =
                resource.AllOperations.SelectMany(cop => cop.Select(rop => rop.ContextualPath.ToString())).Distinct().ToList();
            this.RequestPath = resource.RequestPath.ToString();
            this.isScopedResource = resource.RequestPath.GetScopePath().IsParameterizedScope();
            if (isScopedResource)
            {
                var scopeTypes = resource.RequestPath.GetParameterizedScopeResourceTypes();
                if (scopeTypes != null && scopeTypes.Length > 0)
                    this.ScopeResourceTypes = scopeTypes.Select(st => st.ToString() ?? "<null>").ToList();
            }
            this.ResourceType = resource.ResourceType.ToString() ?? "";
            this.IsSingleton = resource.IsSingleton;
            if (resource.SingletonResourceIdSuffix != null)
                this.SingletonSuffix = resource.SingletonResourceIdSuffix.ToString();
            this.Operations = resource.AllOperations
                .GroupBy(op => op.MethodSignature.Name)
                .OrderBy(g => g.Key)
                .ToDictionary(
                    g => g.Key,
                    g => g.SelectMany(op => op.Select(mrop => new OperationItem(mrop, transformSection))).Distinct().ToList());
            // assume there is no circle in resource hirachy. TODO: handle it if it's not true
            this.ChildResources = resource.ChildResources.Select(r => r.ResourceName).ToList();
            this.ParentResources = resource.GetParents().Select(r => r.ResourceName).ToList();
        }

        [YamlIgnore]
        [JsonIgnore]
        public string Name { get; set; }
        public List<string> ContextPaths { get; set; } = new List<string>();
        public string RequestPath { get; set; } = string.Empty;
        public string ResourceType { get; set; } = "";
        [YamlMember(DefaultValuesHandling = DefaultValuesHandling.OmitDefaults)]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
        public bool isScopedResource { get; set; }
        [YamlMember(DefaultValuesHandling = DefaultValuesHandling.OmitNull)]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public List<string>? ScopeResourceTypes { get; set; }
        [YamlMember(DefaultValuesHandling = DefaultValuesHandling.OmitDefaults)]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
        public bool IsSingleton { get; set; } = false;
        [YamlMember(DefaultValuesHandling = DefaultValuesHandling.OmitNull)]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? SingletonSuffix { get; set; }
        public Dictionary<string, List<OperationItem>> Operations { get; set; } = new Dictionary<string, List<OperationItem>>();
        public List<string> ChildResources { get; set; } = new List<string>();
        public List<string> ParentResources { get; set; } = new List<string>();
    }
}
