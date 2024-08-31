// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System.Reflection;

namespace Microsoft.Generator.CSharp.Perf
{
    internal static class PluginInitializer
    {
        public static void Initialize()
        {
            PluginHandler pluginHandler = new PluginHandler();
            pluginHandler.LoadPlugin(new CommandLineOptions
            {
                OutputDirectory = Path.Combine(Directory.GetParent(Assembly.GetExecutingAssembly().Location)!.FullName, "Projects", "Model"),
                PluginName = "CodeModelPlugin"
            });
        }
    }
}
