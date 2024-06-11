// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.IO;
using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp.Providers
{
    public sealed class ClientProvider : TypeProvider
    {
        private readonly InputClient _inputClient;

        public override string Name { get; }

        public ClientProvider(InputClient inputClient)
        {
            _inputClient = inputClient;
            Name = inputClient.Name.ToCleanName();
        }

        protected override string GetFileName() => Path.Combine("src", "Generated", $"{Name}.cs");

        protected override MethodProvider[] BuildMethods()
        {
            List<MethodProvider> methods = new List<MethodProvider>();

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
