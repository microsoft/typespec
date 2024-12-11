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
            return Path.Combine(nodeModules, "@typespec", "spector");
        }

        internal static string GetSpecDirectory()
        {
            var nodeModules = GetNodeModulesDirectory();
            return Path.Combine(nodeModules, "@typespec", "http-specs");
        }

        internal static string GetScenariosPath()
        {
            return Path.Combine(GetSpecDirectory(), "specs");
        }
        internal static string GetCoverageFilePath()
        {
            return Path.Combine(GetCoverageDirectory(), "cadl-ranch-coverage-csharp-standard.json");
        }

        protected override void Stop(Process process)
        {
            Process.Start(new ProcessStartInfo("node", $"{Path.Combine(GetNodeModulesDirectory(), "@typespec", "spector", "dist", "cli", "cli.js")} server stop --port {Port}"));
            process.WaitForExit();
        }
    }
}
