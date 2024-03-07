// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;

namespace AutoRest.TestServer.Tests.Infrastructure
{
    public class TestServerBase : IDisposable
    {
        private static Lazy<BuildPropertiesAttribute> _buildProperties = new(() => (BuildPropertiesAttribute)typeof(TestServerBase).Assembly.GetCustomAttributes(typeof(BuildPropertiesAttribute), false)[0]);

        private readonly Process _process;
        public HttpClient Client { get; }
        public Uri Host { get; }
        public string Port { get; }

        public TestServerBase(string baseDirectory, string processArguments)
        {
            var portPhrase = "Started server on port ";
            var startup = Path.Combine(baseDirectory, "dist", "cli", "cli.js");

            var processStartInfo = new ProcessStartInfo("node", $"{startup} {processArguments}")
            {
                RedirectStandardOutput = true,
                RedirectStandardError = true
            };

            _process = Process.Start(processStartInfo);
            ProcessTracker.Add(_process);
            Debug.Assert(_process != null);
            while (!_process.HasExited)
            {
                var s = _process.StandardOutput.ReadLine();
                var indexOfPort = s?.IndexOf(portPhrase);
                if (indexOfPort > 0)
                {
                    Port = s.Substring(indexOfPort.Value + portPhrase.Length).Trim();
                    Host = new Uri($"http://localhost:{Port}");
                    Client = new HttpClient
                    {
                        BaseAddress = Host
                    };
                    _ = Task.Run(ReadOutput);
                    return;
                }
            }

            if (Client == null)
            {
                throw new InvalidOperationException($"Unable to detect server port {_process.StandardOutput.ReadToEnd()} {_process.StandardError.ReadToEnd()}");
            }
        }

        protected static string GetCoverageDirectory()
        {
            return Path.Combine(_buildProperties.Value.ArtifactsDirectory, "coverage");
        }

        protected static string GetRepoRootDirectory()
        {
            return _buildProperties.Value.RepoRoot;
        }

        protected static string GetNodeModulesDirectory()
        {
            var repoRoot = _buildProperties.Value.RepoRoot;
            var nodeModulesDirectory = Path.Combine(repoRoot, "node_modules");
            if (Directory.Exists(nodeModulesDirectory))
            {
                return nodeModulesDirectory;
            }

            throw new InvalidOperationException($"Cannot find 'node_modules' in parent directories of {typeof(TestServerV1).Assembly.Location}.");
        }

        private void ReadOutput()
        {
            while (!_process.HasExited && !_process.StandardOutput.EndOfStream)
            {
                _process.StandardOutput.ReadToEnd();
                _process.StandardError.ReadToEnd();
            }
        }

        protected virtual void Stop(Process process)
        {
            process.Kill(true);
        }

        public void Dispose()
        {
            Stop(_process);

            _process?.Dispose();
            Client?.Dispose();
        }
    }
}
