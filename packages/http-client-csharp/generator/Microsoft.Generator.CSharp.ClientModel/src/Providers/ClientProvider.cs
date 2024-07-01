// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public class ClientProvider : RestClientProvider
    {
        public override string RelativeFilePath => Path.Combine("src", "Generated", $"{Name}.cs");

        public ClientProvider(InputClient inputClient) : base(inputClient) { }

        protected override FieldProvider[] BuildFields() => Array.Empty<FieldProvider>();

        protected override MethodProvider[] BuildConstructors()
        {
            return
            [
                new MethodProvider(
                    new ConstructorSignature(Type, $"{InputClient.Description}", MethodSignatureModifiers.Public, []),
                    new MethodBodyStatement[] { PipelineField.Assign(ClientPipelineSnippet.Create()).Terminate() },
                    this)
            ];
        }

        protected override MethodProvider[] BuildMethods()
        {
            List<MethodProvider> methods = new List<MethodProvider>();

            // Build methods for all the operations
            foreach (var operation in InputClient.Operations)
            {
                var methodCollection = ClientModelPlugin.Instance.TypeFactory.CreateMethodProviders(operation, this);
                if (methodCollection != null)
                {
                    methods.AddRange(methodCollection);
                }
            }

            return methods.ToArray();
        }
    }
}
