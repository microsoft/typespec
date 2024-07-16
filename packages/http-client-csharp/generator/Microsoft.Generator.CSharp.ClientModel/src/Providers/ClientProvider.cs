// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
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
    public class ClientProvider : TypeProvider
    {
        private readonly InputClient _inputClient;

        public ClientProvider(InputClient inputClient)
        {
            _inputClient = inputClient;
            PipelineField = new FieldProvider(FieldModifiers.Private, typeof(ClientPipeline), "_pipeline");
        }

        public FieldProvider PipelineField { get; }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", $"{Name}.cs");

        protected override string BuildName() => _inputClient.Name.ToCleanName();

        protected override FieldProvider[] BuildFields()
        {
            return [PipelineField];
        }

        protected override ConstructorProvider[] BuildConstructors()
        {
            return
            [
                new ConstructorProvider(
                    new ConstructorSignature(Type, $"{_inputClient.Description}", MethodSignatureModifiers.Public, []),
                    new MethodBodyStatement[] { PipelineField.Assign(ClientPipelineSnippets.Create()).Terminate() },
                    this)
            ];
        }

        protected override MethodProvider[] BuildMethods()
        {
            List<MethodProvider> methods = new List<MethodProvider>();

            // Build methods for all the operations
            foreach (var operation in _inputClient.Operations)
            {
                var methodCollection = ClientModelPlugin.Instance.TypeFactory.CreateMethods(operation, this);
                if (methodCollection != null)
                {
                    methods.AddRange(methodCollection);
                }
            }

            return methods.ToArray();
        }
    }
}
