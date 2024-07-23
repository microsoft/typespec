// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public class ClientProvider : TypeProvider
    {
        private readonly InputClient _inputClient;
        private RestClientProvider? _restClient;

        internal RestClientProvider RestClient => _restClient ??= new RestClientProvider(_inputClient, this);

        public ClientProvider(InputClient inputClient)
        {
            _inputClient = inputClient;
            PipelineField = new FieldProvider(FieldModifiers.Private, typeof(ClientPipeline), "_pipeline");
            EndpointField = new FieldProvider(FieldModifiers.Private, typeof(Uri), "_endpoint");
        }

        public FieldProvider PipelineField { get; }
        public FieldProvider EndpointField { get; }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", $"{Name}.cs");

        protected override string BuildName() => _inputClient.Name.ToCleanName();

        protected override FieldProvider[] BuildFields()
        {
            return [PipelineField, EndpointField];
        }

        protected override ConstructorProvider[] BuildConstructors()
        {
            return
            [
                new ConstructorProvider(
                    new ConstructorSignature(Type, $"{_inputClient.Description}", MethodSignatureModifiers.Public, []),
                    new MethodBodyStatements(
                    [
                        PipelineField.Assign(ClientPipelineSnippets.Create()).Terminate(),
                        EndpointField.Assign(New.Instance(typeof(Uri), Literal("http://foo.com"))).Terminate()
                    ]),
                    this)
            ];
        }

        protected override MethodProvider[] BuildMethods()
        {
            List<MethodProvider> methods = new List<MethodProvider>(_inputClient.Operations.Count * 4);

            // Build methods for all the operations
            foreach (var operation in _inputClient.Operations)
            {
                methods.AddRange(ClientModelPlugin.Instance.TypeFactory.CreateMethods(operation, this));
            }

            return methods.ToArray();
        }
    }
}
