// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Collections.Immutable;
using System.Reflection;
using Microsoft.CodeAnalysis;
using Moq;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.PostProcessing
{
    internal class WorkspaceMetadataReferenceResolverTests
    {
        // This test validates that the probing paths are correctly set in the resolver.
        [Test]
        public void WorkspaceMetadataReferenceResolverCtor()
        {
            var resolver = new Mock<WorkspaceMetadataReferenceResolver>() { CallBase = true };
            var probingPaths = resolver.Object.GetType()?.BaseType?.GetField("_probingPaths", BindingFlags.NonPublic | BindingFlags.Instance)?.GetValue(resolver.Object) as HashSet<string>;

            Assert.IsNotNull(probingPaths);
            Assert.IsTrue(probingPaths?.Count > 0);
        }

        // This test validates that the resolver returns null when the assembly is not found in the probing paths.
        [Test]
        public void ResolveMissingAssembly_NotFoundInProbingPaths()
        {
            var trustedPlatformAssemblies = ImmutableArray.Create("path/to/assembly1.dll", "path/to/assembly2.dll");
            var resolver = new Mock<WorkspaceMetadataReferenceResolver>() { CallBase = true };
            var referenceIdentity = new AssemblyIdentity("Assembly1");
            resolver.Setup(r => r.FileExists(It.IsAny<string>())).Returns(false);
            var result = resolver.Object.ResolveMissingAssembly(null!, referenceIdentity);

            Assert.IsNull(result);
        }
    }
}
