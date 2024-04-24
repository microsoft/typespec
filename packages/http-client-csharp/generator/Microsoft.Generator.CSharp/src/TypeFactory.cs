// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp
{
    public abstract class TypeFactory
    {
        /// <summary>
        /// Factory method for creating a <see cref="CSharpType"/> based on an input type <paramref name="input"/>.
        /// </summary>
        /// <param name="input">The <see cref="InputType"/> to convert.</param>
        /// <returns>An instance of <see cref="CSharpType"/>.</returns>
        public abstract CSharpType CreateCSharpType(InputType input);

        /// <summary>
        /// Factory method for creating a <see cref="Parameter"/> based on an input parameter <paramref name="parameter"/>.
        /// </summary>
        /// <param name="parameter">The <see cref="InputParameter"/> to convert.</param>
        /// <returns>An instance of <see cref="Parameter"/>.</returns>
        public abstract Parameter CreateCSharpParam(InputParameter parameter);

        /// <summary>
        /// Factory method for creating a <see cref="CSharpMethodCollection"/> based on an input operation <paramref name="operation"/>.
        /// </summary>
        /// <param name="operation">The <see cref="InputOperation"/> to convert.</param>
        /// <returns>An instance of <see cref="CSharpMethodCollection"/> containing the chain of methods
        /// associated with the input operation, or <c>null</c> if no methods are constructed.
        /// </returns>
        public abstract CSharpMethodCollection? CreateCSharpMethodCollection(InputOperation operation);

        public abstract CSharpType MatchConditionsType();
        public abstract CSharpType RequestConditionsType();
        public abstract CSharpType TokenCredentialType();
        public abstract CSharpType PageResponseType();
    }
}
