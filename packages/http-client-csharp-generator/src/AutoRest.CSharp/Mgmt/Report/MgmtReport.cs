// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Encodings.Web;
using System.Text.Json;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace AutoRest.CSharp.Mgmt.Report
{
    internal class MgmtReport
    {
        public static MgmtReport Instance { get; } = new MgmtReport();

        public MgmtReport()
        {
            _sections.Add(ModelSection);
            _sections.Add(EnumSection);
            _sections.Add(ResourceSection);
            _sections.Add(ResourceCollectionSection);
            _sections.Add(ExtensionSection);
            _sections.Add(TransformSection);
            _sections.Add(HelpMessage);
        }

        private List<ReportSection> _sections = new List<ReportSection>();

        public DictionaryReportSection<ModelItem> ModelSection { get; } = new DictionaryReportSection<ModelItem>("ObjectModels");
        public DictionaryReportSection<EnumItem> EnumSection { get; } = new DictionaryReportSection<EnumItem>("EnumModels");
        public DictionaryReportSection<ResourceItem> ResourceSection { get; } = new DictionaryReportSection<ResourceItem>("Resources");
        public DictionaryReportSection<ResourceItem> ResourceCollectionSection { get; } = new DictionaryReportSection<ResourceItem>("ResourceCollections");
        public DictionaryReportSection<ExtensionItem> ExtensionSection { get; } = new DictionaryReportSection<ExtensionItem>("Extensions");
        public TransformSection TransformSection { get; } = new TransformSection("Transforms");
        private DictionaryReportSection<string> HelpMessage { get; } = new DictionaryReportSection<string>("_help_message_", () =>
            new Dictionary<string, string>()
            {
                { "1", "If the transform configuration has a '!' postfix (i.e. 'ProxyResource!'), it means the config is not from *.md config file (i.e. it's built-in through hard code)" },
                { "2", "[{num}] in transform log is the index the transform is applied" },
                { "3", "[=] in transform log means the value (target FullSerializedName) is the same as the key (transform configuration)" },
                { "4", "Supported configuration: mgmt-debug.generate-report=true|false, mgmt-debug.report-only=true|false, mgmt-debug.report-format=yaml|json"}
            });

        public string GenerateReport(string format)
        {
            var reportObj = _sections.ToDictionary(s => s.Name, s => s.GenerateSection());

            switch (format.ToLower())
            {
                case "json":
                    return JsonSerializer.Serialize(reportObj, new JsonSerializerOptions()
                    {
                        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        WriteIndented = true,
                    });
                case "yaml":
                case "":
                    var serializer = new SerializerBuilder()
                        .WithNamingConvention(CamelCaseNamingConvention.Instance)
                        .Build();
                    return serializer.Serialize(reportObj);
                default:
                    throw new ArgumentException($"Unknown Report Format '{format}'. Only 'json' and 'yaml' is supported now");
            }
        }

        public void Reset()
        {
            foreach (var item in _sections)
            {
                item.Reset();
            }
        }
    }
}
