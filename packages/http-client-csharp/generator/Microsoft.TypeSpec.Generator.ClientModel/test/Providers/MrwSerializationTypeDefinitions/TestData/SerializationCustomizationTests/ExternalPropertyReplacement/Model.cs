// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using ExternalModels;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public partial class Model
    {
        public Model() : this("tool", null, null, null, null, null)
        {
        }

        public Model(string id, string parentValue, string name) : this("tool", id, null, parentValue, name, null)
        {
        }

        internal Model(ExternalResponseKind kind, string id, string responseId, string parentValue, string name, IDictionary<string, BinaryData> additionalBinaryDataProperties)
            : base(kind, id)
        {
            Name = name;
            ParentValueReplacement = parentValue;
            _additionalBinaryDataProperties = additionalBinaryDataProperties ?? new Dictionary<string, BinaryData>();
            if (responseId != null)
            {
                _additionalBinaryDataProperties["response_id"] = BinaryData.FromObjectAsJson(responseId);
            }
        }

        [CodeGenMember("ParentValue")]
        public string ParentValueReplacement { get; set; }

        [CodeGenMember("ResponseId")]
        internal string ResponseIdInternal
        {
            get => _additionalBinaryDataProperties.TryGetValue("response_id", out var value)
                ? value.ToObjectFromJson<string>() : null;
        }
    }
}
