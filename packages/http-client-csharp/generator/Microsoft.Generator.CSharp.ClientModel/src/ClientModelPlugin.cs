// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ComponentModel.Composition;
using Microsoft.Generator.CSharp.ClientModel.Expressions;
using Microsoft.Generator.CSharp.ClientModel.Output;
using Microsoft.Generator.CSharp.ClientModel.Writers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Writers;

namespace Microsoft.Generator.CSharp.ClientModel
{
    public class ClientModelPlugin : CodeModelPlugin
    {
        private static ClientModelPlugin? _instance;
        internal static ClientModelPlugin Instance => _instance ?? throw new InvalidOperationException("ClientModelPlugin is not loaded.");
        public override ApiTypes ApiTypes { get; }
        public override CodeWriterExtensionMethods CodeWriterExtensionMethods { get; }

        public override OutputLibrary GetOutputLibrary(InputNamespace input) => new ScmOutputLibrary(input);

        public override ExpressionTypeProviderWriter GetExpressionTypeProviderWriter(CodeWriter writer, ModelTypeProvider model) => new ScmExpressionTypeProviderWriter(writer, model);

        public override TypeFactory TypeFactory { get; }

        public override ExtensibleSnippets ExtensibleSnippets { get; }

        [ImportingConstructor]
        public ClientModelPlugin(GeneratorContext context)
            : base(context)
        {
            TypeFactory = new GeneratorCSharpTypeFactory();
            ExtensibleSnippets = new SystemExtensibleSnippets();
            ApiTypes = new SystemApiTypes();
            CodeWriterExtensionMethods = new ClientModelCodeWriterExtensionMethods();
            _instance = this;
        }
    }
}
