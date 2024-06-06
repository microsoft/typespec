// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.ClientModel
{
    internal class PluginTypeFactory : TypeFactory
    {
        public override ParameterProvider GetParameterProvider(InputParameter inputParameter)
        {
            return new ParameterProvider(inputParameter);
        }

        /// <summary>
        /// Creates a <see cref="CSharpMethodCollection"/> for the given operation. If the operation is a <see cref="OperationKinds.DefaultValue"/> operation,
        /// a method collection will be created consisting of a <see cref="CSharpMethodKinds.CreateMessage"/> method. Otherwise, <c>null</c> will be returned.
        /// </summary>
        /// <param name="operation">The input operation to create methods for.</param>
        public override CSharpMethodCollection? CreateCSharpMethodCollection(InputOperation operation)
        {
            switch (GetOperationKind(operation))
            {
                case var value when value == OperationKinds.Default:
                    return CSharpMethodCollection.DefaultCSharpMethodCollection(operation);
                default:
                    return null;
            }
        }

        /// <summary>
        /// Returns the <see cref="OperationKinds"/> of the given operation.
        /// By default, the operation kind is <see cref="OperationKinds.Default"/>.
        /// </summary>
        private static OperationKinds GetOperationKind(InputOperation operation)
        {
            return operation switch
            {
                { LongRunning: { } } => OperationKinds.LongRunning,
                { Paging: { } } => OperationKinds.Paging,
                _ => OperationKinds.Default,
            };
        }

        // make collection properties have setters
        public override PropertyProvider GetPropertyProvider(InputModelProperty inputProperty) => new PluginPropertyProvider(inputProperty);

        // add a description override
        public override ParameterProvider GetParameterProvider(InputModelProperty inputProperty) => new PluginParameterProvider(inputProperty);

        public override ModelProvider GetModelProvider(InputModelType inputModel) => new PluginModelProvider(inputModel);
    }

    internal class PluginMethodProvider
    {
        public PluginMethodProvider(InputOperation operation)
        {
            throw new NotImplementedException();
        }
    }

    internal class PluginModelProvider : ModelProvider
    {
        public PluginModelProvider(InputModelType inputModel) : base(inputModel)
        {
            throw new NotImplementedException();
        }
    }

    internal class PluginParameterProvider : ParameterProvider
    {
        public PluginParameterProvider(InputModelProperty inputProperty) : base(inputProperty)
        {
            throw new NotImplementedException();
        }
    }

    internal class PluginPropertyProvider : PropertyProvider
    {
        public PluginPropertyProvider(InputModelProperty inputModel) : base(inputModel)
        {
        }

        protected override bool PropertyHasSetter(CSharpType type, InputModelProperty inputProperty)
        {
            return type.IsCollection || base.PropertyHasSetter(type, inputProperty);
        }
    }
}
