// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{    /// <summary>
    /// Represents client information.
    /// </summary>
    /// <summary>

    /// Gets the inputclient.

    /// </summary>

    public class InputClient
    {
        private readonly string? _key;
        private IReadOnlyDictionary<string, InputClientExample>? _examples;        /// <summary>
        /// Initializes a new instance of the <see cref="InputClient"/> class.
        /// </summary>
        public InputClient(
            string name,
            string @namespace,
            string crossLanguageDefinitionId,
            string? summary,
            string? doc,
            IReadOnlyList<InputServiceMethod> methods,
            IReadOnlyList<InputParameter> parameters,
            InputClient? parent,
            IReadOnlyList<InputClient>? children)
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
        }        /// <summary>
        /// Initializes a new instance of the <see cref="InputClient"/> class.
        /// </summary>
        /// <summary>

        /// Gets the  name.

        /// </summary>

        public InputClient() : this(string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, Array.Empty<InputServiceMethod>(), Array.Empty<InputParameter>(), null, null) { }        public string Name { get; internal set; }        /// <summary>
        /// Gets the namespace.
        /// </summary>
        public string Namespace { get; internal set; }        /// <summary>
        /// Gets the crosslanguagedefinitio identifier.
        /// </summary>
        public string CrossLanguageDefinitionId { get; internal set; }        /// <summary>
        /// Gets the summary.
        /// </summary>
        public string? Summary { get; internal set; }        /// <summary>
        /// Gets the doc.
        /// </summary>
        public string? Doc { get; internal set; }        /// <summary>
        /// Gets the methods.
        /// </summary>
        public IReadOnlyList<InputServiceMethod> Methods { get; internal set; }        /// <summary>
        /// Gets the parameters.
        /// </summary>
        public IReadOnlyList<InputParameter> Parameters { get; internal set; }        /// <summary>
        /// Gets the parent.
        /// </summary>
        public InputClient? Parent { get; internal set; }        /// <summary>
        /// Gets the children.
        /// </summary>
        public IReadOnlyList<InputClient> Children { get; internal set; }        /// <summary>
        /// Gets the decorators.
        /// </summary>
        public IReadOnlyList<InputDecoratorInfo> Decorators { get; internal set; } = new List<InputDecoratorInfo>();        /// <summary>
        /// Gets the key.
        /// </summary>
        public string Key
        {
            get => _key ?? Name;
            init => _key = value;
        }        public IReadOnlyDictionary<string, InputClientExample> Examples => _examples ??= EnsureExamples();

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
