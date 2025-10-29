// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    /// <summary>
    /// Represents the initialization information for a client.
    /// </summary>
    public class InputClientInitialization
    {
        public InputClientInitialization(
            IReadOnlyList<InputParameter> parameters,
            int? initializedBy,
            string? access)
        {
            Parameters = parameters;
            InitializedBy = initializedBy;
            Access = access;
        }

        public InputClientInitialization() : this([], null, null) { }

        public IReadOnlyList<InputParameter> Parameters { get; internal set; }
        public int? InitializedBy { get; internal set; }
        public string? Access { get; internal set; }
    }
}
