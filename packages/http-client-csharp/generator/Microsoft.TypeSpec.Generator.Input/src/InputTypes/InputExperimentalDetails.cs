// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    public sealed class InputExperimentalDetails
    {
        [JsonConstructor]
        public InputExperimentalDetails(string? diagnosticId = null, IReadOnlyList<string>? dependsOn = null)
        {
            DiagnosticId = diagnosticId;
            DependsOn = dependsOn ?? [];
        }

        [JsonPropertyName("diagnosticId")]
        public string? DiagnosticId { get; }

        [JsonPropertyName("dependsOn")]
        public IReadOnlyList<string> DependsOn { get; }
    }
}
