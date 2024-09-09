// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using Microsoft.CodeAnalysis;

namespace Microsoft.Generator.CSharp.ClientModel
{
    [Export(typeof(CodeModelPlugin))]
    [ExportMetadata("PluginName", nameof(ClientModelPlugin))]
    public class ClientModelPlugin : CodeModelPlugin
    {
        private static ClientModelPlugin? _instance;
        internal static ClientModelPlugin Instance => _instance ?? throw new InvalidOperationException("ClientModelPlugin is not loaded.");

        private ScmOutputLibrary? _scmOutputLibrary;
        public override OutputLibrary OutputLibrary => _scmOutputLibrary ??= new();

        public override ScmTypeFactory TypeFactory { get; }

        public override IReadOnlyList<MetadataReference> AdditionalMetadataReferences => [MetadataReference.CreateFromFile(typeof(ClientResult).Assembly.Location)];

        [ImportingConstructor]
        public ClientModelPlugin(GeneratorContext context)
            : base(context)
        {
            TypeFactory = new ScmTypeFactory();
            _instance = this;
        }

        public override void Configure()
        {
            AddVisitor(new DefaultScmLibraryVisitor());
        }
    }
}
