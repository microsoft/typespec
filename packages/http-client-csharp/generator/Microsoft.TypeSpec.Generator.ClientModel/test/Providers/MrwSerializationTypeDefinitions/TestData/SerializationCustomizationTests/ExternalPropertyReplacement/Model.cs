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
        public Model() : this("tool", null, null, null, null)
        {
        }

        internal Model(ExternalResponseKind kind, string id, string responseId, string name, IDictionary<string, BinaryData> additionalBinaryDataProperties)
            : base(kind, id)
        {
            Name = name;
            _additionalBinaryDataProperties = additionalBinaryDataProperties ?? new Dictionary<string, BinaryData>();
            if (responseId != null)
            {
                _additionalBinaryDataProperties["response_id"] = BinaryData.FromObjectAsJson(responseId);
            }
        }

        [CodeGenMember("ResponseId")]
        internal string ResponseIdInternal
        {
            get => _additionalBinaryDataProperties.TryGetValue("response_id", out var value)
                ? value.ToObjectFromJson<string>() : null;
        }
    }
}
