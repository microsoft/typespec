// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ComponentModel.Composition;
using Microsoft.TypeSpec.Generator;
using Microsoft.TypeSpec.Generator.ClientModel;

namespace SamplePlugin
{
    [Export(typeof(CodeModelPlugin))]
    [ExportMetadata("PluginName", nameof(SampleCodeModelPlugin))]
    public class SampleCodeModelPlugin: ScmCodeModelPlugin
    {
        private static SampleCodeModelPlugin? _instance;
        internal static SampleCodeModelPlugin Instance => _instance ?? throw new InvalidOperationException("SampleCodeModelPlugin is not loaded.");

        [ImportingConstructor]
        public SampleCodeModelPlugin(GeneratorContext context) : base(context)
        {
            _instance = this;
        }
        public override void Configure()
        {
            AddVisitor(new SamplePluginLibraryVisitor());
        }
    }
}
