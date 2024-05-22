// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ComponentModel.Composition.Hosting;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp
{
    internal class PluginHandler
    {
        public void LoadPlugins(Configuration configuration)
        {
            using DirectoryCatalog directoryCatalog = new(AppContext.BaseDirectory);
            using (CompositionContainer container = new(directoryCatalog))
            {
                CodeModelPlugin.Instance.Configuration = configuration;
                CodeModelPlugin.Instance.ApiTypes = container.GetExportedValueOrDefault<ApiTypes>()
                                                    ?? throw new InvalidOperationException("ApiTypes is not loaded.");
                CodeModelPlugin.Instance.TypeFactory = container.GetExportedValueOrDefault<TypeFactory>()
                                                       ?? throw new InvalidOperationException("TypeFactory is not loaded.");
                CodeModelPlugin.Instance.CodeWriterExtensionMethods = container.GetExportedValueOrDefault<CodeWriterExtensionMethods>()
                                                                      ?? throw new InvalidOperationException("CodeWriterExtensionMethods is not loaded.");
                CodeModelPlugin.Instance.ExtensibleSnippets = container.GetExportedValueOrDefault<ExtensibleSnippets>()
                                                              ?? throw new InvalidOperationException("ExtensibleSnippets is not loaded.");
                CodeModelPlugin.Instance.OutputLibrary = container.GetExportedValueOrDefault<OutputLibrary>()
                                                         ?? new OutputLibrary();
            }
        }
    }
}
