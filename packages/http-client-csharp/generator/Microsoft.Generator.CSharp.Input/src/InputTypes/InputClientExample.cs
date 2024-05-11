// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputClientExample
    {
        public InputClientExample(InputClient client, IReadOnlyList<InputParameterExample> clientParameters)
        {
            Client = client;
            ClientParameters = clientParameters;
        }

        public InputClient Client { get; init; }
        public IReadOnlyList<InputParameterExample> ClientParameters { get; init; }
    }
}
