// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp;
using Microsoft.Generator.CSharp.ClientModel;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;

namespace SamplePlugin
{
    [Export(typeof(CodeModelPlugin))]
    [ExportMetadata("PluginName", nameof(SampleCodeModelPlugin))]
    public class SampleCodeModelPlugin : ClientModelPlugin
    {
        private static SampleCodeModelPlugin? _instance;
        internal static SampleCodeModelPlugin Instance => _instance ?? throw new InvalidOperationException("SampleCodeModelPlugin is not loaded.");

        public override TypeProviderWriter GetWriter(TypeProvider provider) => new(provider);

        public override SamplePluginTypeFactory TypeFactory { get; }

        public override IReadOnlyList<MetadataReference> AdditionalMetadataReferences => [MetadataReference.CreateFromFile(typeof(ClientResult).Assembly.Location)];

        public override OutputLibrary OutputLibrary { get; } = new SamplePluginOutputLibrary();

        [ImportingConstructor]
        public SampleCodeModelPlugin(GeneratorContext context)
            : base(context)
        {
            TypeFactory = new SamplePluginTypeFactory();
            _instance = this;
        }
    }
}
