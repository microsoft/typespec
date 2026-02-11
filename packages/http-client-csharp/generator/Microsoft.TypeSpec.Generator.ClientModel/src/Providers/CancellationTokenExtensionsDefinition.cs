// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.IO;
using System.Threading;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    internal class CancellationTokenExtensionsDefinition : TypeProvider
    {
        private ParameterProvider _cancellationTokenParam;

        public CancellationTokenExtensionsDefinition()
        {
            _cancellationTokenParam = new ParameterProvider("cancellationToken", FormattableStringHelpers.Empty, typeof(CancellationToken));
        }

        protected override TypeSignatureModifiers BuildDeclarationModifiers()
        {
            return TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static;
        }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override string BuildName() => "CancellationTokenExtensions";

        protected override MethodProvider[] BuildMethods()
        {
            return
            [
                BuildToRequestOptionsMethod()
            ];
        }

        private MethodProvider BuildToRequestOptionsMethod()
        {
            var requestOptionsApi = ScmCodeModelGenerator.Instance.TypeFactory.HttpRequestOptionsApi;
            // Build method name like "ToRequestOptions" or "ToRequestContext" based on the parameter name
            var methodName = $"ToRequest{char.ToUpper(requestOptionsApi.ParameterName[0])}{requestOptionsApi.ParameterName.Substring(1)}";

            var modifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Extension;

            var signature = new MethodSignature(
                methodName,
                null,
                modifiers,
                requestOptionsApi.HttpRequestOptionsType,
                null,
                [_cancellationTokenParam]);

            var body = IHttpRequestOptionsApiSnippets.ToRequestOptions(_cancellationTokenParam);

            return new MethodProvider(signature, body, this, XmlDocProvider.Empty);
        }
    }
}
