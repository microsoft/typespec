// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputNamespace
    {
        private static readonly string[] _knownBadNamespaceSegments =
        [
            "Type",
            "Array",
            "Enum",
        ];

        public InputNamespace(string name, IReadOnlyList<string> apiVersions, IReadOnlyList<InputEnumType> enums, IReadOnlyList<InputModelType> models, IReadOnlyList<InputClient> clients, InputAuth auth, IReadOnlyList<string>? badNamespaceSegments = null)
        {
            Name = name;
            ApiVersions = apiVersions;
            Enums = enums;
            Models = models;
            Clients = clients;
            Auth = auth;
            BadNamespaceSegments = badNamespaceSegments != null ?
                [.._knownBadNamespaceSegments, ..badNamespaceSegments] :
                _knownBadNamespaceSegments;
        }

        public InputNamespace() : this(name: string.Empty, apiVersions: Array.Empty<string>(), enums: Array.Empty<InputEnumType>(), models: Array.Empty<InputModelType>(), clients: Array.Empty<InputClient>(), auth: new InputAuth()) { }

        public string Name { get; init; }
        public IReadOnlyList<string> ApiVersions { get; init; }
        public IReadOnlyList<InputEnumType> Enums { get; init; }
        public IReadOnlyList<InputModelType> Models { get; init; }
        public IReadOnlyList<InputClient> Clients { get; init; }
        public InputAuth Auth { get; init; }
        public IReadOnlyList<string> BadNamespaceSegments { get; init; }
    }
}
