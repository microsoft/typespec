// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputOAuth2Auth
    {
        [JsonConstructor]
        public InputOAuth2Auth(IReadOnlyCollection<string> scopes)
        {
            Scopes = scopes;
        }

        public InputOAuth2Auth() : this(Array.Empty<string>()) { }

        public IReadOnlyCollection<string> Scopes { get; }
    }
}
