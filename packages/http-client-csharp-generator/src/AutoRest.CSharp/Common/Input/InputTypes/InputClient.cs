// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Input.Examples;

namespace AutoRest.CSharp.Common.Input;

internal record InputClient(string Name, string Description, IReadOnlyList<InputOperation> Operations, bool Creatable, IReadOnlyList<InputParameter> Parameters, string? Parent)
{
    private readonly string? _key;

    // No field in record can be lazy initialized - it breaks discovery in dictionary
    private readonly Dictionary<string, InputClientExample> _examples = new();

    public string Key
    {
        get => _key ?? Name;
        init => _key = value;
    }

    public InputClient() : this(string.Empty, string.Empty, Array.Empty<InputOperation>(), true, Array.Empty<InputParameter>(), null) { }

    public IReadOnlyDictionary<string, InputClientExample> Examples => EnsureExamples();

    private IReadOnlyDictionary<string, InputClientExample> EnsureExamples()
    {
        if (!_examples.Any())
        {
            _examples[ExampleMockValueBuilder.ShortVersionMockExampleKey] = ExampleMockValueBuilder.BuildClientExample(this, false);
            _examples[ExampleMockValueBuilder.MockExampleAllParameterKey] = ExampleMockValueBuilder.BuildClientExample(this, true);
        }

        return _examples;
    }
}
