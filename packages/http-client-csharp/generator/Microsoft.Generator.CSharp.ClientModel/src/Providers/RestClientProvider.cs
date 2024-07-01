// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public class RestClientProvider : TypeProvider
    {
        public InputClient InputClient { get; }

        public override string RelativeFilePath => Path.Combine("src", "Generated", $"{Name}.RestInternal.cs");

        public override string Name { get; }

        public FieldProvider PipelineField { get; }

        public RestClientProvider(InputClient inputClient)
        {
            InputClient = inputClient;
            Name = inputClient.Name.ToCleanName();
            PipelineField = new FieldProvider(FieldModifiers.Private, typeof(ClientPipeline), "_pipeline");
        }

        protected override FieldProvider[] BuildFields()
        {
            return [PipelineField];
        }

        protected override MethodProvider[] BuildMethods()
        {
            List<MethodProvider> methods = new List<MethodProvider>();

            foreach (var operation in InputClient.Operations)
            {
                methods.Add(BuildCreateMessageMethod(operation));
            }

            return methods.ToArray();
        }

        private MethodProvider BuildCreateMessageMethod(InputOperation operation)
        {
            var methodProvider = (ScmMethodProviderCollection)ClientModelPlugin.Instance.TypeFactory.CreateMethodProviders(operation, this);

            var methodModifier = MethodSignatureModifiers.Internal;
            var methodSignature = new MethodSignature(
                methodProvider.CreateRequestMethodName,
                FormattableStringHelpers.FromString(operation.Description),
                methodModifier,
                typeof(PipelineMessage),
                null,
                Parameters: [.. methodProvider.MethodParameters, ScmKnownParameters.RequestOptions]);
            var methodBody = Throw(New.NotImplementedException(Literal("Method not implemented.")));

            return new MethodProvider(methodSignature, methodBody, this);
        }
    }
}
