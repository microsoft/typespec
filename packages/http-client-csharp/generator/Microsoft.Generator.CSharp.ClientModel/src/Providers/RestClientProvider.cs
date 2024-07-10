// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using Microsoft.Generator.CSharp.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public class RestClientProvider : TypeProvider
    {
        private readonly InputClient _inputClient;
        internal ClientProvider ClientProvider { get; }

        public RestClientProvider(InputClient inputClient)
        {
            _inputClient = inputClient;
            ClientProvider = new ClientProvider(inputClient);
        }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", $"{Name}.RestClient.cs");

        protected override string BuildName() => _inputClient.Name.ToCleanName();

        protected override MethodProvider[] BuildMethods()
        {
            List<MethodProvider> methods = new List<MethodProvider>();

            foreach (var operation in _inputClient.Operations)
            {
                var methodProvider = (ScmMethodProviderCollection)ClientModelPlugin.Instance.TypeFactory.CreateMethodProviders(operation, ClientProvider);
                methods.Add(methodProvider.BuildCreateMessageMethod());
            }

            return methods.ToArray();
        }
    }
}
