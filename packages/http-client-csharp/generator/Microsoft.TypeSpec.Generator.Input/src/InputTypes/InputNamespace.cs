// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputNamespace
    {
        private static readonly string[] _knownInvalidNamespaceSegments =
        [
            "Type",
            "Array",
            "Enum",
        ];

        public InputNamespace(string name, IReadOnlyList<string> apiVersions, IReadOnlyList<InputEnumType> enums, IReadOnlyList<InputModelType> models, IReadOnlyList<InputClient> clients, InputAuth? auth, IReadOnlyList<string>? invalidNamespaceSegments = null)
        {
            Name = name;
            ApiVersions = apiVersions;
            Enums = enums;
            Models = models;
            Clients = clients;
            Auth = auth;
            InvalidNamespaceSegments = invalidNamespaceSegments != null ?
                [.._knownInvalidNamespaceSegments, ..invalidNamespaceSegments] :
                _knownInvalidNamespaceSegments;
        }

        public InputNamespace() : this(name: string.Empty, apiVersions: Array.Empty<string>(), enums: Array.Empty<InputEnumType>(), models: Array.Empty<InputModelType>(), clients: Array.Empty<InputClient>(), auth: new InputAuth()) { }

        public string Name { get; init; }
        public IReadOnlyList<string> ApiVersions { get; init; }
        public IReadOnlyList<InputEnumType> Enums { get; init; }
        public IReadOnlyList<InputModelType> Models { get; init; }
        public IReadOnlyList<InputClient> Clients { get; init; }
        public InputAuth? Auth { get; init; }
        public IReadOnlyList<string> InvalidNamespaceSegments { get; init; }
    }
}
