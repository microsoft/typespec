// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using YamlDotNet.Serialization;

namespace AutoRest.CSharp.Mgmt.Report
{
    internal class TransformItem : IEquatable<TransformItem?>
    {
        private const string SEP = ">>";

        public TransformItem(string transformType, string key, bool isFromConfig, params string[] arguments)
        {
            TransformType = transformType;
            Key = key;
            Arguments = arguments;
            IsFromConfig = isFromConfig;
        }

        public TransformItem(string transformType, string key, params string[] arguments)
            : this(transformType, key, false, arguments)
        {
        }

        public string TransformType { get; set; }
        public string Key { get; set; }
        public string[] Arguments { get; set; }
        [YamlIgnore]
        [JsonIgnore]
        public string ArgumentsAsString
        {
            get { return string.Join(SEP, this.Arguments); }
        }
        public bool IsFromConfig { get; set; }

        public override string ToString()
        {
            return $"<{TransformType}> {Key}{(this.Arguments.Length > 0 ? $":{this.ArgumentsAsString}" : "")}{(this.IsFromConfig ? "" : "!")}";
        }

        public override bool Equals(object? obj)
        {
            return Equals(obj as TransformItem);
        }

        public bool Equals(TransformItem? other)
        {
            if (other == null)
                return false;
            if (TransformType != other.TransformType || Key != other.Key || Arguments.Length != other.Arguments.Length)
                return false;
            for (int i = 0; i < Arguments.Length; i++)
                if (Arguments[i] != other.Arguments[i])
                    return false;
            return true;
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(TransformType, Key, ArgumentsAsString);
        }

        public static bool operator ==(TransformItem? left, TransformItem? right)
        {
            return EqualityComparer<TransformItem>.Default.Equals(left, right);
        }

        public static bool operator !=(TransformItem? left, TransformItem? right)
        {
            return !(left == right);
        }
    }
}
