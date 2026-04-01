// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ComponentModel.Composition;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;

namespace Microsoft.TypeSpec.Generator.ClientModel
{
    [Export(typeof(CodeModelGenerator))]
    [ExportMetadata(GeneratorMetadataName, nameof(ScmCodeModelGenerator))]
    public class ScmCodeModelGenerator : CodeModelGenerator
    {
        private static ScmCodeModelGenerator? _instance;
        internal static new ScmCodeModelGenerator Instance => _instance ?? throw new InvalidOperationException("ScmCodeModelGenerator is not loaded.");

        private ScmOutputLibrary? _scmOutputLibrary;
        public override OutputLibrary OutputLibrary => _scmOutputLibrary ??= new();

        public override ScmTypeFactory TypeFactory { get; }

        internal ModelSerializationExtensionsDefinition ModelSerializationExtensionsDefinition { get; } =
            new ModelSerializationExtensionsDefinition();

        internal SerializationFormatDefinition SerializationFormatDefinition { get; } =
            new SerializationFormatDefinition();

        /// <summary>
        /// Gets the options that control ConfigurationSchema.json generation.
        /// </summary>
        public ConfigurationSchemaOptions ConfigurationSchema { get; } = new();

        [ImportingConstructor]
        public ScmCodeModelGenerator(GeneratorContext context)
            : base(context)
        {
            TypeFactory = new ScmTypeFactory();
            _instance = this;
        }

        protected override void Configure()
        {
            base.Configure();
            AddMetadataReference(MetadataReference.CreateFromFile(typeof(ClientResult).Assembly.Location));
            AddMetadataReference(MetadataReference.CreateFromFile(typeof(BinaryData).Assembly.Location));
            AddMetadataReference(MetadataReference.CreateFromFile(typeof(JsonSerializer).Assembly.Location));
            AddTypeToKeep(ModelReaderWriterContextDefinition.s_name, isRoot: false);
        }

        public override async Task WriteAdditionalFiles(string outputPath)
        {
            var schemaContent = ConfigurationSchemaGenerator.Generate(
                OutputLibrary,
                ConfigurationSchema.SectionName,
                ConfigurationSchema.OptionsRef);
            if (schemaContent != null)
            {
                var schemaPath = Path.Combine(outputPath, "schema", "ConfigurationSchema.json");
                var schemaDir = Path.GetDirectoryName(schemaPath);
                if (schemaDir != null)
                {
                    Directory.CreateDirectory(schemaDir);
                }
                Emitter.Info($"Writing {Path.GetFullPath(schemaPath)}");
                await File.WriteAllTextAsync(schemaPath, schemaContent);

                if (ConfigurationSchema.GenerateNuGetTargets)
                {
                    // Generate the .targets file for JsonSchemaSegment registration
                    var packageName = Configuration.PackageName;
                    var targetsPath = Path.Combine(outputPath, $"{packageName}.NuGet.targets");
                    var targetsContent = GenerateTargetsFile();
                    Emitter.Info($"Writing {Path.GetFullPath(targetsPath)}");
                    await File.WriteAllTextAsync(targetsPath, targetsContent);
                }
            }
        }

        private static string GenerateTargetsFile()
        {
            return "<Project>\n" +
                   "  <ItemGroup>\n" +
                   "    <JsonSchemaSegment Include=\"$(MSBuildThisFileDirectory)..\\..\\ConfigurationSchema.json\"\n" +
                   "                       FilePathPattern=\"appsettings.*.json\" />\n" +
                   "  </ItemGroup>\n" +
                   "</Project>\n";
        }
    }
}
