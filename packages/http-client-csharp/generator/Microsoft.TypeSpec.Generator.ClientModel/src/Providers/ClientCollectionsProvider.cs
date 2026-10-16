// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System.Linq;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public class ClientCollectionsProvider : TypeProvider
    {
        public ClientCollectionsProvider(ClientProvider client)
        {
            Client = client;
        }

        public ClientProvider Client { get; }

        protected override string BuildName() => Client.Name;

        protected override string BuildNamespace() => Client.Type.Namespace;

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", $"{Name}.Collections.cs");

        protected override TypeSignatureModifiers BuildDeclarationModifiers() => Client.DeclarationModifiers;

        protected override TypeProvider[] BuildNestedTypes()
        {
            // Keep helpers for customized or suppressed paging methods; unused helpers are removed by the post processor.
            return Client.SpecView.Methods.OfType<ScmMethodProvider>()
                .Select(method => method.CollectionDefinition)
                .OfType<TypeProvider>()
                .Distinct()
                .ToArray();
        }
    }
}
