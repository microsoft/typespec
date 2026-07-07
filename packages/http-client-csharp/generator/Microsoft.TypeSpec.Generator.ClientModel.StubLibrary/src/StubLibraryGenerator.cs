// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ComponentModel.Composition;

namespace Microsoft.TypeSpec.Generator.ClientModel.StubLibrary
{
    [Export(typeof(CodeModelGenerator))]
    [ExportMetadata(GeneratorMetadataName, nameof(StubLibraryGenerator))]
    public class StubLibraryGenerator : ScmCodeModelGenerator
    {
        [ImportingConstructor]
        public StubLibraryGenerator(GeneratorContext context) : base(context) { }

        protected override void Configure()
        {
            base.Configure();
            AddVisitor(new StubLibraryVisitor());
        }
    }
}
