﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputClient
    {
        private readonly string? _key;
        private IReadOnlyDictionary<string, InputClientExample>? _examples;

        public InputClient(string name, string description, IReadOnlyList<InputOperation> operations, bool creatable, IReadOnlyList<InputParameter> parameters, string? parent)
        {
            Name = name;
            Description = description;
            Operations = operations;
            Creatable = creatable;
            Parameters = parameters;
            Parent = parent;
        }

        public InputClient() : this(string.Empty, string.Empty, Array.Empty<InputOperation>(), true, Array.Empty<InputParameter>(), null) { }

        public string Name { get; init; }
        public string Description { get; init; }
        public IReadOnlyList<InputOperation> Operations { get; init; }
        public bool Creatable { get; init; }
        public IReadOnlyList<InputParameter> Parameters { get; init; }
        public string? Parent { get; init; }

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
