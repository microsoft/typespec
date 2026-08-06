// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Microsoft.TypeSpec.Generator.Utilities;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Utilities
{
    [NonParallelizable]
    public class NugetAssemblyResolverTests
    {
        private string? _tempDirectory;

        [SetUp]
        public void Setup()
        {
            _tempDirectory = Path.Combine(Path.GetTempPath(), "TestArtifacts", Guid.NewGuid().ToString());
            Directory.CreateDirectory(_tempDirectory);
        }

        [TearDown]
        public void Cleanup()
        {
            NugetAssemblyResolver.Deactivate();
            Directory.Delete(_tempDirectory!, true);
        }

        [Test]
        public void Resolve_ReturnsNullAndLogsWhenAssemblyCannotBeLoaded()
        {
            var packageName = $"Test.InvalidAssembly.{Guid.NewGuid():N}";
            var assemblyPath = Path.Combine(
                _tempDirectory!,
                packageName.ToLowerInvariant(),
                "1.0.0",
                "lib",
                "netstandard2.0",
                $"{packageName}.dll");
            Directory.CreateDirectory(Path.GetDirectoryName(assemblyPath)!);
            File.WriteAllText(assemblyPath, "not an assembly");
            var debugMessages = new List<string>();
            var resolver = new NugetAssemblyResolver(_tempDirectory!, debugMessages.Add, _ => { });

            var resolved = resolver.Resolve(new AssemblyName($"{packageName}, Version=1.0.0.0"));

            Assert.IsNull(resolved);
            Assert.That(debugMessages, Has.Some.Contains("Failed to load dependency assembly"));
        }

        [Test]
        public void Resolve_ReturnsAssemblyWhenMetadataReferenceRegistrationFails()
        {
            var packageName = $"Test.MetadataFailure.P{Guid.NewGuid():N}";
            CreateFakeNuGetPackage(packageName);
            var debugMessages = new List<string>();
            var resolver = new NugetAssemblyResolver(
                _tempDirectory!,
                debugMessages.Add,
                _ => throw new InvalidOperationException("metadata failure"));

            var resolved = resolver.Resolve(new AssemblyName($"{packageName}, Version=1.0.0.0"));

            Assert.IsNotNull(resolved);
            Assert.AreEqual(packageName, resolved!.GetName().Name);
            Assert.That(debugMessages, Has.Some.Contains("Failed to add metadata reference"));
        }

        [Test]
        public void RegisterPackageClosure_LogsMalformedNuspecWithoutThrowing()
        {
            var packageName = $"Test.MalformedNuspec.P{Guid.NewGuid():N}";
            var assemblyPath = CreateFakeNuGetPackage(packageName);
            var versionDirectory = Path.GetDirectoryName(
                Path.GetDirectoryName(
                    Path.GetDirectoryName(assemblyPath)))!;
            File.WriteAllText(
                Path.Combine(versionDirectory, $"{packageName.ToLowerInvariant()}.nuspec"),
                "<not-valid-nuspec");
            var debugMessages = new List<string>();
            var resolver = new NugetAssemblyResolver(_tempDirectory!, debugMessages.Add, _ => { });

            Assert.DoesNotThrow(() => resolver.RegisterPackageClosure(assemblyPath));
            Assert.That(debugMessages, Has.Some.Contains("Failed to read"));
        }

        private string CreateFakeNuGetPackage(string packageName)
        {
            var source = Helpers.GetExpectedFromFile(method: "PackageSource")
                .Replace("$PACKAGE$", packageName);
            return FakeNuGetPackage.Create(
                _tempDirectory!,
                packageName,
                "1.0.0",
                source);
        }
    }
}
