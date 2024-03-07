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
    internal class ExtensionItem
    {
        public ExtensionItem(MgmtExtension extension, TransformSection transformSection)
        {
            this.Name = extension.ResourceName;
            this.ContextPaths =
                extension.AllOperations.SelectMany(cop => cop.Select(rop => rop.ContextualPath.ToString())).Distinct().ToList();
            this.Operations = extension.AllOperations
                .GroupBy(op => op.MethodSignature.Name)
                .OrderBy(g => g.Key)
                .ToDictionary(
                    g => g.Key,
                    g => g.SelectMany(op => op.Select(mrop => new OperationItem(mrop, transformSection))).Distinct().ToList());
        }

        public ExtensionItem(MgmtMockableExtension mockableExtension, TransformSection transformSection)
        {
            this.Name = mockableExtension.ResourceName;
            this.ContextPaths =
                mockableExtension.AllOperations.SelectMany(cop => cop.Select(rop => rop.ContextualPath.ToString())).Distinct().ToList();
            this.Operations = mockableExtension.AllOperations
                .GroupBy(op => op.MethodSignature.Name)
                .ToDictionary(
                    g => g.Key,
                    g => g.SelectMany(op => op.Select(mrop => new OperationItem(mrop, transformSection))).Distinct().ToList());
        }

        [YamlIgnore]
        [JsonIgnore]
        public string Name { get; set; }
        public List<string> ContextPaths { get; set; } = new List<string>();
        public Dictionary<string, List<OperationItem>> Operations { get; set; } = new Dictionary<string, List<OperationItem>>();
    }
}
