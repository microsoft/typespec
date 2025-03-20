// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputClient
    {
        private readonly string? _key;
        private IReadOnlyDictionary<string, InputClientExample>? _examples;

        public InputClient(string name, string @namespace, string crossLanguageDefinitionId, string? summary, string? doc, IReadOnlyList<InputOperation> operations, IReadOnlyList<InputParameter> parameters, InputClient? parent, IReadOnlyList<InputClient>? children)
        {
            Name = name;
            Namespace = @namespace;
            CrossLanguageDefinitionId = crossLanguageDefinitionId;
            Summary = summary;
            Doc = doc;
            Operations = operations;
            Parameters = parameters;
            Parent = parent;
            Children = children ?? [];
        }

        public InputClient() : this(string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, Array.Empty<InputOperation>(), Array.Empty<InputParameter>(), null, null) { }

        public string Name { get; internal set; }
        public string Namespace { get; internal set; }
        public string CrossLanguageDefinitionId { get; internal set; }
        public string? Summary { get; internal set; }
        public string? Doc { get; internal set; }
        public IReadOnlyList<InputOperation> Operations { get; internal set; }
        public IReadOnlyList<InputParameter> Parameters { get; internal set; }
        public InputClient? Parent { get; internal set; }
        public IReadOnlyList<InputClient> Children { get; internal set; }
        public IReadOnlyList<InputDecoratorInfo> Decorators { get; internal set; } = new List<InputDecoratorInfo>();

        public string Key
        {
            get => _key ?? Name;
            init => _key = value;
        }

        public IReadOnlyDictionary<string, InputClientExample> Examples => _examples ??= EnsureExamples();

        private IReadOnlyDictionary<string, InputClientExample> EnsureExamples()
        {
            return new Dictionary<string, InputClientExample>()
            {
                [ExampleMockValueBuilder.ShortVersionMockExampleKey] = ExampleMockValueBuilder.BuildClientExample(this, false),
                [ExampleMockValueBuilder.MockExampleAllParameterKey] = ExampleMockValueBuilder.BuildClientExample(this, true)
            };
        }
    }
}
