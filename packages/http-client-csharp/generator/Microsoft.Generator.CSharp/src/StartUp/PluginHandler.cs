// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using System.ComponentModel.Composition.Hosting;
using System.Linq;

namespace Microsoft.Generator.CSharp
{
    internal class PluginHandler
    {
        public void LoadPlugin(string outputDirectory)
        {
            using DirectoryCatalog directoryCatalog = new(AppContext.BaseDirectory);
            using (CompositionContainer container = new(directoryCatalog))
            {
                container.ComposeExportedValue(new GeneratorContext(Configuration.Load(outputDirectory)));
                var plugin = GetMostDerived(container.GetExportedValues<CodeModelPlugin>());
                if (plugin == null)
                {
                    throw new InvalidOperationException($"Cannot find exported value in current directory {AppContext.BaseDirectory}.");
                }
            }
        }

        private static T? GetMostDerived<T>(IEnumerable<T>? instances)
        {
            if (instances is null)
            {
                return default;
            }
            var map = instances.ToDictionary(i => i!.GetType());
            HashSet<Type> set = new HashSet<Type>(map.Keys);
            HashSet<Type> baseTypes = new HashSet<Type>();
            foreach (var type in map.Keys)
            {
                if (type.BaseType is null)
                {
                    throw new Exception("Should never reach here.");
                }

                if (!baseTypes.Add(type.BaseType))
                {
                    throw new InvalidOperationException("Cannot have multiple types with the same base type.");
                }
            }

            foreach (var type in map.Keys)
            {
                if (!baseTypes.Contains(type))
                {
                    return map[type];
                }
            }
            throw new Exception("Should never reach here.");
        }
    }
}
