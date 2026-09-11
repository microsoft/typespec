// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    public sealed class InputExperimentalDetails
    {
        public InputExperimentalDetails()
        {
        }

        public InputExperimentalDetails(string? diagnosticId, IReadOnlyList<string> dependsOn)
        {
            DiagnosticId = diagnosticId;
            DependsOn = dependsOn;
        }

        [JsonPropertyName("diagnosticId")]
        public string? DiagnosticId { get; init; }

        [JsonPropertyName("dependsOn")]
        public IReadOnlyList<string> DependsOn { get; init; } = [];
    }
}
