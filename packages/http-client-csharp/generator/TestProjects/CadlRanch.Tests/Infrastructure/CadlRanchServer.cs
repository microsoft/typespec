// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Diagnostics;
using System.IO;

namespace TestProjects.CadlRanch.Tests
{
    public class CadlRanchServer : TestServerBase
    {
        public CadlRanchServer() : base(GetBaseDirectory(), $"serve {GetScenariosPath()} --port 0 --coverageFile {GetCoverageFilePath()}")
        {
        }

        internal static string GetBaseDirectory()
        {
            var nodeModules = GetNodeModulesDirectory();
            return Path.Combine(nodeModules, "@azure-tools", "cadl-ranch");
        }

        internal static string GetSpecDirectory()
        {
            var nodeModules = GetNodeModulesDirectory();
            return Path.Combine(nodeModules, "@azure-tools", "cadl-ranch-specs");
        }

        internal static string GetScenariosPath()
        {
            return Path.Combine(GetSpecDirectory(), "http");
        }
        internal static string GetCoverageFilePath()
        {
            return Path.Combine(GetCoverageDirectory(), "cadl-ranch-coverage-csharp-standard.json");
        }

        protected override void Stop(Process process)
        {
            Process.Start(new ProcessStartInfo("node", $"{Path.Combine(GetNodeModulesDirectory(), "@azure-tools", "cadl-ranch", "dist", "cli", "cli.js")} server stop --port {Port}"));
            process.WaitForExit();
        }
    }
}
