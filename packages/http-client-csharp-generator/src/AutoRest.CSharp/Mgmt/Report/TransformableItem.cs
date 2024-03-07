// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using YamlDotNet.Serialization;

namespace AutoRest.CSharp.Mgmt.Report
{
    internal class TransformableItem
    {
        private TransformSection _transformSection;
        public TransformableItem(string fullSerializedName, TransformSection transformSection)
        {
            this.FullSerializedName = fullSerializedName;
            this._transformSection = transformSection;
        }

        public string FullSerializedName { get; set; }
        protected virtual HashSet<string>? TransformTypeAllowList { get { return null; } }

        private List<string>? _appliedTransformLogs;

        [YamlMember(DefaultValuesHandling = DefaultValuesHandling.OmitEmptyCollections | DefaultValuesHandling.OmitNull)]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public List<string>? TransformLogs
        {
            get
            {
                {
                    if (_appliedTransformLogs is null)
                    {
                        _appliedTransformLogs = _transformSection.GetAppliedTransformLogs(
                        this.FullSerializedName, this.TransformTypeAllowList)
                        .OrderBy(item => item.Log.Index)
                        .Select(item => $"[{item.Log.Index}][{item.Transform}] {item.Log.LogMessage}").ToList();
                    }
                    // return null when it's an empty list so that it will be ignored in Json
                    return _appliedTransformLogs.Count == 0 ? null : _appliedTransformLogs;
                }
            }
        }
    }
}
