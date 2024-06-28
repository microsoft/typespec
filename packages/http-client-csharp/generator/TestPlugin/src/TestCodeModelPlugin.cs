// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.TestPlugin
{
    public class TestCodeModelPlugin : CodeModelPlugin
    {
        private TestPluginOutputLibrary? _scmOutputLibrary;
        public override OutputLibrary OutputLibrary => _scmOutputLibrary ??= new();

        public override TypeProviderWriter GetWriter(TypeProvider provider) => new(provider);

        public override TestPluginTypeFactory TypeFactory { get; }

        public override IReadOnlyList<MetadataReference> AdditionalMetadataReferences => [MetadataReference.CreateFromFile(typeof(ClientResult).Assembly.Location)];

        [ImportingConstructor]
        public TestCodeModelPlugin(GeneratorContext context)
            : base(context)
        {
            TypeFactory = new TestPluginTypeFactory();
        }
    }
}
