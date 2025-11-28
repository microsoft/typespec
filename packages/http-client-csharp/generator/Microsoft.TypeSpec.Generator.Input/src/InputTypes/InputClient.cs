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
        public InputClientInitializedBy? InitializedBy { get; internal set; }
        public InputClient? Parent { get; internal set; }
        public IReadOnlyList<InputClient> Children { get; internal set; }
        public IReadOnlyList<InputDecoratorInfo> Decorators { get; internal set; } = new List<InputDecoratorInfo>();
        public IReadOnlyList<string> ApiVersions { get; internal set; }

        public string Key
        {
            get => _key ?? Name;
            init => _key = value;
        }

        /// <summary>
        /// Updates the properties of the input client.
        /// </summary>
        /// <param name="name">The new name for the client.</param>
        /// <param name="namespace">The new namespace for the client.</param>
        /// <param name="crossLanguageDefinitionId">The new cross-language definition ID for the client.</param>
        /// <param name="summary">The new summary for the client.</param>
        /// <param name="doc">The new documentation for the client.</param>
        /// <param name="methods">The new methods for the client.</param>
        /// <param name="parameters">The new parameters for the client.</param>
        /// <param name="parent">The new parent client.</param>
        /// <param name="children">The new children clients.</param>
        /// <param name="apiVersions">The new API versions for the client.</param>
        public void Update(
            string? name = null,
            string? @namespace = null,
            string? crossLanguageDefinitionId = null,
            string? summary = null,
            string? doc = null,
            IEnumerable<InputServiceMethod>? methods = null,
            IEnumerable<InputParameter>? parameters = null,
            InputClient? parent = null,
            IEnumerable<InputClient>? children = null,
            IEnumerable<string>? apiVersions = null)
        {
            if (name != null)
            {
                Name = name;
            }

            if (@namespace != null)
            {
                Namespace = @namespace;
            }

            if (crossLanguageDefinitionId != null)
            {
                CrossLanguageDefinitionId = crossLanguageDefinitionId;
            }

            if (summary != null)
            {
                Summary = summary;
            }

            if (doc != null)
            {
                Doc = doc;
            }

            if (methods != null)
            {
                Methods = [.. methods];
            }

            if (parameters != null)
            {
                Parameters = [.. parameters];
            }

            if (parent != null)
            {
                Parent = parent;
            }

            if (children != null)
            {
                Children = [.. children];
            }

            if (apiVersions != null)
            {
                ApiVersions = [.. apiVersions];
            }
        }
    }
}
