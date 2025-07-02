// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{    /// <summary>
    /// Represents namespace information.
    /// </summary>
    /// <summary>

    /// Gets the inputnamespace.

    /// </summary>

    public class InputNamespace
    {
        private static readonly string[] _knownInvalidNamespaceSegments =
        [
            "Type",
            "Array",
            "Enum",
        ];

        private readonly List<string> _invalidNamespaceSegments;        /// <summary>
        /// Initializes a new instance of the <see cref="InputNamespace"/> class.
        /// </summary>
        public InputNamespace(string name, IReadOnlyList<string> apiVersions, IReadOnlyList<InputLiteralType> constants, IReadOnlyList<InputEnumType> enums, IReadOnlyList<InputModelType> models, IReadOnlyList<InputClient> rootClients, InputAuth? auth)
        {
            Name = name;
            ApiVersions = apiVersions;
            Constants = constants;
            Enums = enums;
            Models = models;
            RootClients = rootClients;
            Auth = auth;
            _invalidNamespaceSegments = [.. _knownInvalidNamespaceSegments];
            InvalidNamespaceSegments = _invalidNamespaceSegments;
            _clients = new Lazy<IReadOnlyList<InputClient>>(() => BuildAllClients(RootClients));
        }        /// <summary>
        /// Initializes a new instance of the <see cref="InputNamespace"/> class.
        /// </summary>
        /// <summary>

        /// Gets the  name.

        /// </summary>

        public InputNamespace() : this(name: string.Empty, apiVersions: Array.Empty<string>(), constants: Array.Empty<InputLiteralType>(), enums: Array.Empty<InputEnumType>(), models: Array.Empty<InputModelType>(), rootClients: Array.Empty<InputClient>(), auth: new InputAuth()) { }        public string Name { get; init; }        /// <summary>
        /// Gets the apiversions.
        /// </summary>
        public IReadOnlyList<string> ApiVersions { get; init; }        /// <summary>
        /// Gets the constants.
        /// </summary>
        public IReadOnlyList<InputLiteralType> Constants { get; init; }        /// <summary>
        /// Gets the enums.
        /// </summary>
        public IReadOnlyList<InputEnumType> Enums { get; init; }        /// <summary>
        /// Gets the models.
        /// </summary>
        public IReadOnlyList<InputModelType> Models { get; init; }        /// <summary>
        /// Gets the rootclients.
        /// </summary>
        public IReadOnlyList<InputClient> RootClients { get; init; }

        public IReadOnlyList<InputClient> Clients => _clients.Value;

        // Use Lazy for the backing field since the property that exposes this is public and we want thread-safety
        private readonly Lazy<IReadOnlyList<InputClient>> _clients;        /// <summary>
        /// Gets the auth.
        /// </summary>
        public InputAuth? Auth { get; init; }        /// <summary>
        /// Gets the invalidnamespacesegments.
        /// </summary>
        public IReadOnlyList<string> InvalidNamespaceSegments { get; init; }

        internal void AddInvalidNamespaceSegment(string segment) => _invalidNamespaceSegments.Add(segment);

        private static IReadOnlyList<InputClient> BuildAllClients(IEnumerable<InputClient> rootClients)
        {
            var clients = new List<InputClient>();
            GetAllClients(rootClients, clients);
            return clients;
        }
        private static void GetAllClients(IEnumerable<InputClient> rootClients, List<InputClient> clients)
        {
            foreach (var client in rootClients)
            {
                clients.Add(client);
                GetAllClients(client.Children, clients);
            }
        }
    }
}
