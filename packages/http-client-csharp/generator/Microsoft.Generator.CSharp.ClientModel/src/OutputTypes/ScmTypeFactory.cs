// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.ClientModel
{
    public class ScmTypeFactory : TypeFactory
    {
        private readonly IDictionary<InputModelType, ModelProvider> _models = new Dictionary<InputModelType, ModelProvider>();
        private readonly IDictionary<InputEnumType, EnumProvider> _enums = new Dictionary<InputEnumType, EnumProvider>();
        private readonly IDictionary<InputClient, ClientProvider> _clients = new Dictionary<InputClient, ClientProvider>();
        private readonly Dictionary<InputOperation, MethodProviderCollection?> _operations = new Dictionary<InputOperation, MethodProviderCollection?>();

        public override ModelProvider CreateModel(InputModelType inputModel)
        {
            if (_models.TryGetValue(inputModel, out var modelProvider))
            {
                return modelProvider;
            }

            modelProvider = new ModelProvider(inputModel);
            _models.Add(inputModel, modelProvider);
            return modelProvider;
        }

        public override EnumProvider CreateEnum(InputEnumType inputEnum)
        {
            if (_enums.TryGetValue(inputEnum, out var enumProvider))
            {
                return enumProvider;
            }

            enumProvider = EnumProvider.Create(inputEnum);
            _enums.Add(inputEnum, enumProvider);
            return enumProvider;
        }

        public override ClientProvider CreateClient(InputClient inputClient)
        {
            if (_clients.TryGetValue(inputClient, out var clientProvider))
            {
                return clientProvider;
            }

            clientProvider = new ClientProvider(inputClient);
            _clients.Add(inputClient, clientProvider);
            return clientProvider;
        }

        public override ParameterProvider CreateCSharpParam(InputParameter inputParameter)
        {
            return new ParameterProvider(inputParameter);
        }

        /// <summary>
        /// Creates a <see cref="MethodProviderCollection"/> for the given operation. If the operation is a <see cref="InputOperationKinds.DefaultValue"/> operation,
        /// a method collection will be created consisting of a <see cref="CSharpMethodKinds.CreateMessage"/> method. Otherwise, <c>null</c> will be returned.
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
