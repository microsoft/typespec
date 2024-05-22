// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp
{
    public sealed class ClientTypeProvider : TypeProvider
    {
        private readonly InputClient _inputClient;

        public override string Name { get; }

        public ClientTypeProvider(InputClient inputClient, SourceInputModel? sourceInputModel)
            : base(sourceInputModel)
        {
            _inputClient = inputClient;
            Name = inputClient.Name.ToCleanName();
        }

        protected override CSharpMethod[] BuildMethods()
        {
            List<CSharpMethod> methods = new List<CSharpMethod>();

            // Build methods for all the operations
            foreach (var operation in _inputClient.Operations)
            {
                var methodCollection = CodeModelPlugin.Instance.TypeFactory.CreateCSharpMethodCollection(operation);
                if (methodCollection != null)
                {
                    methods.AddRange(methodCollection);
                }
            }

            return methods.ToArray();
        }
    }
}
