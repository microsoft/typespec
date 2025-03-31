// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using System.ComponentModel.Composition.Hosting;

namespace Microsoft.TypeSpec.Generator
{
    internal class GeneratorHandler
    {
        public void LoadGenerator(CommandLineOptions options)
        {
            using DirectoryCatalog directoryCatalog = new(AppContext.BaseDirectory);
            using CompositionContainer container = new(directoryCatalog);

            container.ComposeExportedValue(new GeneratorContext(Configuration.Load(options.OutputDirectory)));
            container.ComposeParts(this);

            SelectGenerator(options);
        }

        internal void SelectGenerator(CommandLineOptions options)
        {
            bool loaded = false;
            foreach (var generator in Generators!)
            {
                if (generator.Metadata.GeneratorName == options.GeneratorName!)
                {
                    CodeModelGenerator.Instance = generator.Value;
                    CodeModelGenerator.Instance.IsNewProject = options.IsNewProject;

                    // Apply discovered plugins (if any)
                    if (Plugins != null)
                    {
                        foreach (var plugin in Plugins)
                        {
                            plugin.Apply(CodeModelGenerator.Instance);
                        }
                    }

                    CodeModelGenerator.Instance.Configure();
                    loaded = true;
                    break;
                }
            }

            if (!loaded)
            {
                throw new InvalidOperationException($"Generator {options.GeneratorName} not found.");
            }
        }

        [ImportMany]
        public IEnumerable<Lazy<CodeModelGenerator, IMetadata>>? Generators { get; set; }

        [ImportMany]
        public IEnumerable<GeneratorPlugin>? Plugins { get; set; }
    }

    public interface IMetadata
    {
        string GeneratorName { get; }
    }
}
