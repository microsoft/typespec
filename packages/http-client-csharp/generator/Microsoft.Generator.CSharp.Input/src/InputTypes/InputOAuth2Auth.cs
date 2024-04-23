// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputOAuth2Auth : InputAuth
    {
        public InputOAuth2Auth(IReadOnlyCollection<string> scopes) : base()
        {
            Scopes = scopes;
        }

        public InputOAuth2Auth() : this(Array.Empty<string>()) { }

        public IReadOnlyCollection<string> Scopes { get; }
    }
}
