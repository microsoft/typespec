// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
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
        public override MethodProviderCollection CreateMethodProviders(InputOperation operation, TypeProvider enclosingType) => new ScmMethodProviderCollection(operation, enclosingType);

        public virtual CSharpType MatchConditionsType() => typeof(PipelineMessageClassifier);

        public virtual CSharpType TokenCredentialType() => typeof(ApiKeyCredential);
    }
}
