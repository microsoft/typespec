// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ComponentModel.Composition;
using Microsoft.Generator.CSharp.ClientModel;
using Microsoft.Generator.CSharp.ClientModel.Expressions;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Writers;

namespace Microsoft.Generator.CSharp.Plugin.Tests
{
    public class TestPlugin : CodeModelPlugin
    {
        private static TestPlugin? _instance;
        internal static TestPlugin TestInstance => _instance ?? throw new InvalidOperationException("TestPlugin is not loaded.");
        public override ApiTypes ApiTypes { get; }
        public override CodeWriterExtensionMethods CodeWriterExtensionMethods { get; }

        private OutputLibrary? _outputLibrary;
        public override OutputLibrary OutputLibrary => _outputLibrary ??= new();

        public override TypeProviderWriter GetWriter(CodeWriter writer, TypeProvider provider) => new(writer, provider);

        public override TypeFactory TypeFactory { get; }

        public override ExtensibleSnippets ExtensibleSnippets { get; }

        [ImportingConstructor]
        public TestPlugin(GeneratorContext context)
            : base(context)
        {
            TypeFactory = new PluginTypeFactory();
            ExtensibleSnippets = new SystemExtensibleSnippets();
            ApiTypes = new SystemApiTypes();
            CodeWriterExtensionMethods = new CodeWriterExtensionMethods();
            _instance = this;
        }
    }
}
