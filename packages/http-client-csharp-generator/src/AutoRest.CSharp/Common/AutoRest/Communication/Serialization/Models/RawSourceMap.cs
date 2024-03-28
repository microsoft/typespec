// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.CSharp.Utilities;

namespace AutoRest.CSharp.AutoRest.Communication.Serialization.Models
{
    internal class RawSourceMap
    {
        public string? File { get; set; } = null;
        public string? SourceRoot { get; set; } = null;
        public string? Version { get; set; }
        public string[]? Sources { get; set; }
        public string[]? Names { get; set; }
        public string[]? SourcesContent { get; set; } = null;
        public string? Mappings { get; set; }

        public override string ToString() => $@"{{""version"":""{Version}"",""sources"":{Sources.ToJsonArray()},""names"":{Names.ToJsonArray()},""mappings"":""{Mappings}""{File.TextOrEmpty($@",""file"":""{File}""")}{SourceRoot.TextOrEmpty($@",""sourceRoot"":""{SourceRoot}""")}{SourcesContent.TextOrEmpty($@",""sourcesContent"":{SourcesContent.ToJsonArray()}")}}}";
    }
}
