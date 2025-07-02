// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{    /// <summary>
    /// Represents clientexample information.
    /// </summary>
    /// <summary>

    /// Gets the inputclientexample.

    /// </summary>

    public class InputClientExample
    {        /// <summary>
        /// Initializes a new instance of the <see cref="InputClientExample"/> class.
        /// </summary>
        public InputClientExample(InputClient client, IReadOnlyList<InputParameterExample> clientParameters)
        {
            Client = client;
            ClientParameters = clientParameters;
        }        /// <summary>
        /// Gets the client.
        /// </summary>
        public InputClient Client { get; init; }        /// <summary>
        /// Gets the clientparameters.
        /// </summary>
        public IReadOnlyList<InputParameterExample> ClientParameters { get; init; }
    }
}
