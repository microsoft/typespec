// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputClient
    {
        private readonly string? _key;

        public InputClient(
            string name,
            string @namespace,
            string crossLanguageDefinitionId,
            string? summary,
            string? doc,
            IReadOnlyList<InputServiceMethod> methods,
            IReadOnlyList<InputParameter> parameters,
            InputClient? parent,
            IReadOnlyList<InputClient>? children,
            IReadOnlyList<string>? apiVersions)
        {
            Name = name;
            Namespace = @namespace;
            CrossLanguageDefinitionId = crossLanguageDefinitionId;
            Summary = summary;
            Doc = doc;
            Methods = methods;
            Parameters = parameters;
            Parent = parent;
            Children = children ?? [];
            ApiVersions = apiVersions ?? [];
        }

        public InputClient() : this(string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, Array.Empty<InputServiceMethod>(), Array.Empty<InputParameter>(), null, null, null) { }

        public string Name { get; internal set; }
        public string Namespace { get; internal set; }
        public string CrossLanguageDefinitionId { get; internal set; }
        public string? Summary { get; internal set; }
        public string? Doc { get; internal set; }
        public IReadOnlyList<InputServiceMethod> Methods { get; internal set; }
        public IReadOnlyList<InputParameter> Parameters { get; internal set; }
        public InputClient? Parent { get; internal set; }
        public IReadOnlyList<InputClient> Children { get; internal set; }
        public IReadOnlyList<InputDecoratorInfo> Decorators { get; internal set; } = new List<InputDecoratorInfo>();
        public IReadOnlyList<string> ApiVersions { get; internal set; }

        public string Key
        {
            get => _key ?? Name;
            init => _key = value;
        }
    }
}
