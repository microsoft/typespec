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
        [TestCase(true)]
        [TestCase(false)]
        public void Resolve_ReturnsNullAndLogsWhenAssemblyCannotBeLoaded(bool addToClosure)
        {
            var packageName = $"Test.InvalidAssembly.P{Guid.NewGuid():N}";
            var assemblyPath = Path.Combine(
                _tempDirectory!,
                packageName.ToLowerInvariant(),
                "1.0.0",
                "lib",
                "netstandard2.0",
                $"{packageName}.dll");
            CreateFakeNuGetPackage(packageName);
            
            var debugMessages = new List<string>();
            var resolver = new NugetAssemblyResolver(_tempDirectory!, debugMessages.Add, _ => { });
            if (addToClosure)
            {
                resolver.RegisterPackageClosure(assemblyPath);
            }
            // Break the package.
            File.WriteAllText(assemblyPath, "not an assembly");
            var resolved = resolver.Resolve(new AssemblyName($"{packageName}, Version=1.0.0.0"));

            Assert.IsNull(resolved);
            if (addToClosure)
            {
                Assert.That(debugMessages, Has.Some.Contains("Failed to load dependency assembly"));
            }
            else
            {
                Assert.That(debugMessages, Has.Some.Contains("Could not locate dependency assembly"));
            }
        }

        [Test]
        [TestCase(true)]
        [TestCase(false)]
        public void Resolve_ReturnsAssemblyWhenMetadataReferenceRegistrationFails(bool addToClosure)
        {
            var packageName = $"Test.MetadataFailure.P{Guid.NewGuid():N}";
            var packageVersion = "1.0.0.0";
            CreateFakeNuGetPackage(packageName);
            var debugMessages = new List<string>();
            var resolver = new NugetAssemblyResolver(
                _tempDirectory!,
                debugMessages.Add,
                _ => throw new InvalidOperationException("metadata failure"));
            if (addToClosure)
            {
                var assemblyPath = Path.Combine(_tempDirectory!, packageName.ToLowerInvariant(), "1.0.0", "lib", "netstandard2.0", $"{packageName}.dll");
                resolver.RegisterPackageClosure(assemblyPath);
            }

            var resolved = resolver.Resolve(new AssemblyName($"{packageName}, Version={packageVersion}"));

            if (addToClosure)
            {
                Assert.IsNotNull(resolved);
                Assert.AreEqual(packageName, resolved!.GetName().Name);
                Assert.That(debugMessages, Has.Some.Contains("Failed to add metadata reference"));
            }
            else
            {
                Assert.IsNull(resolved);
            }
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
