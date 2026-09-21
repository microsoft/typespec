// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputDecoratorInfo
    {
        public InputDecoratorInfo(string name, IReadOnlyDictionary<string, BinaryData>? arguments)
        {
            Name = name;
            Arguments = arguments;
        }
        public string Name { get; }
        public IReadOnlyDictionary<string, BinaryData>? Arguments { get; }

        /// <summary>
        /// Arguments containing cyclic code-model graphs, represented as versioned reference envelopes
        /// rather than plain JSON. Ordinary JSON arguments, including envelope-shaped user data, are not marked.
        /// </summary>
        public IReadOnlySet<string> ReferenceEncodedArguments { get; internal init; } = new HashSet<string>();
    }
}
