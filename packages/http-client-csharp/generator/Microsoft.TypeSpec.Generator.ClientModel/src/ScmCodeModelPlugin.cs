// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ComponentModel.Composition;
using System.Text.Json;
using Microsoft.CodeAnalysis;

namespace Microsoft.TypeSpec.Generator.ClientModel
{
    [Export(typeof(CodeModelPlugin))]
    [ExportMetadata("PluginName", nameof(ScmCodeModelPlugin))]
    public class ScmCodeModelPlugin : CodeModelPlugin
    {
        private static ScmCodeModelPlugin? _instance;
        internal static ScmCodeModelPlugin Instance => _instance ?? throw new InvalidOperationException("ScmCodeModelPlugin is not loaded.");

        private ScmOutputLibrary? _scmOutputLibrary;
        public override OutputLibrary OutputLibrary => _scmOutputLibrary ??= new();

        public override ScmTypeFactory TypeFactory { get; }

        [ImportingConstructor]
        public ScmCodeModelPlugin(GeneratorContext context)
            : base(context)
        {
            TypeFactory = new ScmTypeFactory();
            _instance = this;
        }

        public override void Configure()
        {
            base.Configure();
            AddVisitor(new DefaultScmLibraryVisitor());
            AddMetadataReference(MetadataReference.CreateFromFile(typeof(ClientResult).Assembly.Location));
            AddMetadataReference(MetadataReference.CreateFromFile(typeof(BinaryData).Assembly.Location));
            AddMetadataReference(MetadataReference.CreateFromFile(typeof(JsonSerializer).Assembly.Location));
        }
    }
}
