// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputOAuth2Auth
    {
        public InputOAuth2Auth(IReadOnlyCollection<InputOAuth2Flow> flows)
        {
            Flows = flows;
        }

        public IReadOnlyCollection<InputOAuth2Flow> Flows { get; }
    }
}
