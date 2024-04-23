// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp
{
    /// <summary>
    /// This class provides a method for creating CSharpType objects based on input types.
    /// </summary>
    public abstract class TypeFactory
    {
        /// <summary>
        /// Factory method for creating a <see cref="CSharpType"/> based on an input type <paramref name="input"/>.
        /// </summary>
        /// <param name="input">The <see cref="InputType"/> to convert.</param>
        /// <returns>An instance of <see cref="CSharpType"/>.</returns>
        public abstract CSharpType CreateType(InputType input);

        /// <summary>
        /// Factory method for creating a <see cref="Method"/> based on an input operation <paramref name="operation"/>.
        /// </summary>
        /// <param name="operation">The <see cref="InputOperation"/> to convert.</param>
        /// <param name="returnProtocol">Flag that can be used to determine if the protocol method should be returned.</param>
        /// <returns>The constructed <see cref="Method"/>.</returns>
        public abstract Method CreateMethod(InputOperation operation, bool returnProtocol = true);
        public abstract CSharpType MatchConditionsType();
        public abstract CSharpType RequestConditionsType();
        public abstract CSharpType TokenCredentialType();
        public abstract CSharpType PageResponseType();
    }
}
