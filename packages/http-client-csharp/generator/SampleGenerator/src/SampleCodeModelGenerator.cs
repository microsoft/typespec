// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ComponentModel.Composition;
using Microsoft.TypeSpec.Generator;
using Microsoft.TypeSpec.Generator.ClientModel;

namespace SampleGenerator
{
    [Export(typeof(CodeModelGenerator))]
    [ExportMetadata(GeneratorMetadataName, nameof(SampleCodeModelGenerator))]
    public class SampleCodeModelGenerator: ScmCodeModelGenerator
    {
        private static SampleCodeModelGenerator? _instance;
        internal static SampleCodeModelGenerator Instance => _instance ?? throw new InvalidOperationException("SampleCodeModelGenerator is not loaded.");

        [ImportingConstructor]
        public SampleCodeModelGenerator(GeneratorContext context) : base(context)
        {
            _instance = this;
        }
        public override void Configure()
        {
            AddVisitor(new SampleGeneratorLibraryVisitor());
        }
    }
}
