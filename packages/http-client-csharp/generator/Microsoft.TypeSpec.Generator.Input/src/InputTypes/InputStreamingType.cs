// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    /// <summary>
    /// Represents a sequence of values streamed over the wire.
    /// </summary>
    public sealed class InputStreamingType : InputType
    {
        public InputStreamingType(
            string name,
            string crossLanguageDefinitionId,
            InputType valueType,
            IReadOnlyList<string> contentTypes,
            string streamKind = "jsonl",
            string? terminalEventType = null,
            string? terminalEventValue = null)
            : base(name)
        {
            CrossLanguageDefinitionId = crossLanguageDefinitionId;
            ValueType = valueType;
            ContentTypes = contentTypes;
            StreamKind = streamKind;
            TerminalEventType = terminalEventType;
            TerminalEventValue = terminalEventValue;
        }

        public string CrossLanguageDefinitionId { get; internal set; }
        public InputType ValueType { get; internal set; }
        public IReadOnlyList<string> ContentTypes { get; internal set; }
        public string StreamKind { get; internal set; }
        public string? TerminalEventType { get; internal set; }
        public string? TerminalEventValue { get; internal set; }
    }
}
