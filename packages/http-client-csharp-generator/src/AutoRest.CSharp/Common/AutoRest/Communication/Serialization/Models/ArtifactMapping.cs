// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.CSharp.Utilities;

namespace AutoRest.CSharp.AutoRest.Communication.Serialization.Models
{
    internal class ArtifactMapping : IArtifact
    {
        public string? Uri { get; set; }
        public string? Type { get; set; }
        public string? Content { get; set; }
        public Mapping[]? SourceMap { get; set; } = null;

        public override string ToString() => $@"{{""uri"":""{Uri}"",""type"":""{Type}"",""content"":""{Content.ToStringLiteral()}""{SourceMap.TextOrEmpty($@",""sourceMap"":{SourceMap.ToJsonArray()}")}}}";
    }
}
