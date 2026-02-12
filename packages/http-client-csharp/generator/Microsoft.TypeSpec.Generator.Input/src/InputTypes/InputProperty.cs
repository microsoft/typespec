// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public abstract class InputProperty
    {
        protected InputProperty(string name, string? summary, string? doc, InputType type, bool isRequired, bool isReadOnly, string? access, string serializedName, bool isApiVersion, InputConstant? defaultValue)
        {
            Name = name;
            Summary = summary;
            Doc = doc;
            Type = type;
            IsRequired = isRequired;
            IsReadOnly = isReadOnly;
            Access = access;
            SerializedName = serializedName;
            IsApiVersion = isApiVersion;
            DefaultValue = defaultValue;
        }

        public string Name { get; internal set; }
        public string? Summary { get; internal set; }
        public string? Doc { get; internal set; }
        public InputType Type { get; internal set; }
        public bool IsRequired { get; internal set; }
        public bool IsReadOnly { get; internal set; }
        public string? Access { get; internal set; }
        public string SerializedName { get; internal set; }
        public IReadOnlyList<InputDecoratorInfo> Decorators { get; internal set; } = new List<InputDecoratorInfo>();
        public InputModelType? EnclosingType { get; internal set; }
        public bool IsApiVersion { get; internal set; }
        public InputConstant? DefaultValue { get; internal set; }
    }
}
