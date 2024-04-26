// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputNamespace
    {
        public InputNamespace(string name, string description, IReadOnlyList<string> apiVersions, IReadOnlyList<InputEnumType> enums, IReadOnlyList<InputModelType> models, IReadOnlyList<InputClient> clients, InputAuth auth)
        {
            Name = name;
            Description = description;
            ApiVersions = apiVersions;
            Enums = enums;
            Models = models;
            Clients = clients;
            Auth = auth;
        }

        public InputNamespace() : this(name: string.Empty, description: string.Empty, apiVersions: Array.Empty<string>(), enums: Array.Empty<InputEnumType>(), models: Array.Empty<InputModelType>(), clients: Array.Empty<InputClient>(), auth: new InputAuth()) { }

        public string Name { get; internal set; }
        public string Description { get; internal set; }
        public IReadOnlyList<string> ApiVersions { get; internal set; }
        public IReadOnlyList<InputEnumType> Enums { get; internal set; }
        public IReadOnlyList<InputModelType> Models { get; internal set; }
        public IReadOnlyList<InputClient> Clients { get; internal set; }
        public InputAuth Auth { get; internal set; }
    }
}
