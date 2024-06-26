// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.ClientModel
{
    public class ScmTypeFactory : TypeFactory
    {
        private readonly Dictionary<InputOperation, MethodProviderCollection?> _operations = new Dictionary<InputOperation, MethodProviderCollection?>();

        /// <summary>
        /// Creates a <see cref="MethodProviderCollection"/> for the given operation. If the operation is a <see cref="InputOperationKinds.DefaultValue"/> operation,
        /// a method collection will be created. Otherwise, <c>null</c> will be returned.
        /// </summary>
        /// <param name="operation">The input operation to create methods for.</param>
        /// <param name="enclosingType">The enclosing type of the operation.</param>
        public override MethodProviderCollection? CreateMethodProviders(InputOperation operation, TypeProvider enclosingType)
        {
            if (_operations.TryGetValue(operation, out var methods))
            {
                return methods;
            }

            methods = GetOperationKind(operation).ToString() switch
            {
                "Default" => MethodProviderCollection.DefaultCSharpMethodCollection(operation, enclosingType),
                _ => null,
            };

            _operations.Add(operation, methods);
            return methods;
        }

        /// <summary>
        /// Returns the <see cref="InputOperationKinds"/> of the given operation.
        /// By default, the operation kind is <see cref="InputOperationKinds.Default"/>.
        /// </summary>
        private static InputOperationKinds GetOperationKind(InputOperation operation)
        {
            return operation switch
            {
                { LongRunning: { } } => InputOperationKinds.LongRunning,
                { Paging: { } } => InputOperationKinds.Paging,
                _ => InputOperationKinds.Default,
            };
        }

        public virtual CSharpType MatchConditionsType()
        {
            // TO-DO: Determine what the correct type is for MatchConditions: https://github.com/Azure/autorest.csharp/issues/4166
            throw new NotImplementedException();
        }

        public virtual CSharpType RequestConditionsType()
        {
            // TO-DO: Determine what the correct type is for RequestConditions: https://github.com/Azure/autorest.csharp/issues/4166
            throw new NotImplementedException();
        }

        public virtual CSharpType TokenCredentialType()
        {
            // TO-DO: Determine what the correct type is for TokenCredential: https://github.com/Azure/autorest.csharp/issues/4166
            throw new NotImplementedException();
        }

        public virtual CSharpType PageResponseType()
        {
            // TO-DO: Determine what the correct type is for Page: https://github.com/Azure/autorest.csharp/issues/4166
            throw new NotImplementedException();
        }
    }
}
