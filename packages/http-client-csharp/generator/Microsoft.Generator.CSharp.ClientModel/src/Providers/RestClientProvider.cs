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

        public override string RelativeFilePath => Path.Combine("src", "Generated", $"{Name}.RestClient.cs");

        public override string Name { get; }

        internal ClientProvider ClientProvider { get; }

        public RestClientProvider(InputClient inputClient)
        {
            _inputClient = inputClient;
            Name = inputClient.Name.ToCleanName();
            ClientProvider = new ClientProvider(inputClient);
        }

        protected override MethodProvider[] BuildMethods()
        {
            List<MethodProvider> methods = new List<MethodProvider>();

            foreach (var operation in _inputClient.Operations)
            {
                methods.Add(BuildCreateMessageMethod(operation));
            }

            return methods.ToArray();
        }

        private MethodProvider BuildCreateMessageMethod(InputOperation operation)
        {
            var methodProvider = (ScmMethodProviderCollection)ClientModelPlugin.Instance.TypeFactory.CreateMethods(operation, ClientProvider);

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
