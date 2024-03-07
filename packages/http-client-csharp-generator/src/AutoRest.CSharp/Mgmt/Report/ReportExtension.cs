// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using AutoRest.CSharp.Generation.Types;

namespace AutoRest.CSharp.Mgmt.Report
{
    internal static class ReportExtension
    {
        public static T AddToTransformerStore<T>(this T items, string transformerType, bool fromConfig) where T : IEnumerable<string>
        {
            foreach (var item in items)
                MgmtReport.Instance.TransformSection.AddTransformer(transformerType, item, fromConfig);
            return items;
        }

        public static IReadOnlyDictionary<string, string> AddToTransformerStore(this IReadOnlyDictionary<string, string> dict, string transformerType, bool fromConfig)
        {
            return AddToTransformerStore<string>(dict, transformerType, (arg) => new TransformItem[] { new TransformItem(arg.Type, arg.Key, fromConfig, arg.Value) });
        }

        public static IReadOnlyDictionary<string, T> AddToTransformerStore<T>(this IReadOnlyDictionary<string, T> dict, string transformerType, Func<(string Type, string Key, T Value), IEnumerable<TransformItem>> toTransformerArguments)
        {
            foreach (var kv in dict)
            {
                var items = toTransformerArguments((transformerType, kv.Key, kv.Value));
                MgmtReport.Instance.TransformSection.AddTransformers(items);
            }
            return dict;
        }

        public static string GetNameForReport(this CSharpType type)
        {
            return type.ToString().Trim().Replace("global::", "");
        }
    }
}
