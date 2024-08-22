// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ComponentModel.Composition;
using Microsoft.Generator.CSharp;
using Microsoft.Generator.CSharp.ClientModel;

namespace SamplePlugin
{
    [Export(typeof(CodeModelPlugin))]
    [ExportMetadata("PluginName", nameof(SampleCodeModelPlugin))]
    [method: ImportingConstructor]
    public class SampleCodeModelPlugin(GeneratorContext context) : ClientModelPlugin(context)
    {
        public override void Configure()
        {
            AddVisitor(new SamplePluginLibraryLibraryVisitor());
        }
    }
}
