// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ComponentModel.Composition;
using Microsoft.TypeSpec.Generator;
using Microsoft.TypeSpec.Generator.ClientModel;

namespace SamplePlugin
{
    [Export(typeof(CodeModelPlugin))]
    [ExportMetadata("PluginName", nameof(SampleCodeModelPlugin))]
    [method: ImportingConstructor]
    public class SampleCodeModelPlugin(GeneratorContext context) : ScmCodeModelPlugin(context)
    {
        public override ScmTypeFactory TypeFactory { get; } = new SampleTypeFactory();

        public override void Configure()
        {
            AddVisitor(new SamplePluginLibraryLibraryVisitor());
        }
    }
}
