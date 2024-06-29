// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.IO;
using Microsoft.Generator.CSharp;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.SamplePlugin;

namespace SamplePlugin.Providers
{
    public sealed class ClientProvider : TypeProvider
    {
        private readonly InputClient _inputClient;

        public override string RelativeFilePath => Path.Combine("src", "Generated", $"{Name}.cs");

        public override string Name { get; }

        public ClientProvider(InputClient inputClient)
        {
            _inputClient = inputClient;
            Name = inputClient.Name;
        }

        protected override MethodProvider[] BuildMethods()
        {
            List<MethodProvider> methods = new List<MethodProvider>();

            // Build methods for all the operations
            foreach (var operation in _inputClient.Operations)
            {
                var methodCollection = SampleCodeModelPlugin.Instance.TypeFactory.CreateMethodProviders(operation, this);
                if (methodCollection != null)
                {
                    methods.AddRange(methodCollection);
                }
            }

            return methods.ToArray();
        }
    }
}
