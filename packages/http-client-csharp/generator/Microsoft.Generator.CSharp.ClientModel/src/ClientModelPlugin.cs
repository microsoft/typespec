// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ComponentModel.Composition;
using Microsoft.Generator.CSharp.ClientModel.Expressions;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Writers;

namespace Microsoft.Generator.CSharp.ClientModel
{
    public class ClientModelPlugin : CodeModelPlugin
    {
        private static ClientModelPlugin? _instance;
        internal static ClientModelPlugin Instance => _instance ?? throw new InvalidOperationException("ClientModelPlugin is not loaded.");
        public override ApiTypes ApiTypes { get; }
        public override CodeWriterExtensionMethods CodeWriterExtensionMethods { get; }

        private OutputLibrary? _scmOutputLibrary;
        public override OutputLibrary OutputLibrary => _scmOutputLibrary ??= new();

        public override ExpressionTypeProviderWriter GetExpressionTypeProviderWriter(CodeWriter writer, TypeProvider provider) => new(writer, provider);

        public override TypeFactory TypeFactory { get; }

        public override ExtensibleSnippets ExtensibleSnippets { get; }

        [ImportingConstructor]
        public ClientModelPlugin(GeneratorContext context)
            : base(context)
        {
            TypeFactory = new ScmTypeFactory();
            ExtensibleSnippets = new SystemExtensibleSnippets();
            ApiTypes = new SystemApiTypes();
            CodeWriterExtensionMethods = new();
            _instance = this;
        }
    }
}
