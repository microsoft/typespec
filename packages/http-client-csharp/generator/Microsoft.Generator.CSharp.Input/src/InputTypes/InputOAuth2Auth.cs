// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputOAuth2Auth
    {
        public InputOAuth2Auth(IReadOnlyCollection<string> scopes)
        {
            Scopes = scopes;
        }

        public IReadOnlyCollection<string> Scopes { get; }
    }
}
