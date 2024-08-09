// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ComponentModel.Composition;

namespace Microsoft.Generator.CSharp.ClientModel.StubLibrary
{
    [Export(typeof(CodeModelPlugin))]
    [ExportMetadata("PluginName", nameof(StubLibraryPlugin))]
    public class StubLibraryPlugin : ClientModelPlugin
    {
        [ImportingConstructor]
        public StubLibraryPlugin(GeneratorContext context) : base(context) { }

        public override void Configure()
        {
            AddVisitor(new StubLibraryVisitor());
        }
    }
}
