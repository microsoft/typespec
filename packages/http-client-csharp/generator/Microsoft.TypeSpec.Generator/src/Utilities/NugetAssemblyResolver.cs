// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;
using System.Threading;
using Microsoft.CodeAnalysis;
using NuGet.Frameworks;
using NuGet.Packaging;
using NuGet.Packaging.Core;
using NuGet.Versioning;

namespace Microsoft.TypeSpec.Generator.Utilities
{
    /// <summary>
    /// Satisfies the transitive assembly references of external-type assemblies loaded by
    /// <see cref="ExternalTypeReferenceResolver"/> by probing the NuGet global packages folder.
    /// </summary>
    /// <remarks>
    /// External-type assemblies are loaded with <see cref="Assembly.Load(byte[])"/> into the default
    /// <see cref="AssemblyLoadContext"/>, which resolves dependencies only from the generator's own
    /// trusted-platform-assemblies list. A package such as <c>Azure.AI.Extensions.OpenAI</c> depends on
    /// <c>Azure.Core</c> and <c>OpenAI</c>, neither of which the generator references, so without this
    /// hook <c>Assembly.GetType(identity, throwOnError: false)</c> silently returns <c>null</c> for any
    /// type whose base type lives in a dependency. The external type then appears unresolvable and is
    /// generated instead of referenced.
    /// </remarks>
    internal static class NugetAssemblyResolver
    {
        // Cached resolution per assembly simple name. A null value means resolution was attempted and
        // failed, so repeated references to the same missing dependency don't re-probe the file system.
        private static readonly ConcurrentDictionary<string, Assembly?> _resolved =
            new(StringComparer.OrdinalIgnoreCase);

        // Tracks assembly paths already registered as Roslyn metadata references.
        private static readonly ConcurrentDictionary<string, byte> _registeredReferences =
            new(StringComparer.OrdinalIgnoreCase);

        // Package id -> package version, for every package in the dependency closure of an external-type
        // package. Populated from .nuspec files so dependencies bind to the version NuGet would have
        // chosen rather than a version guessed from the referencing assembly's version number.
        private static readonly ConcurrentDictionary<string, NuGetVersion> _closureVersions =
            new(StringComparer.OrdinalIgnoreCase);

        // Package version directories whose .nuspec has already been walked.
        private static readonly ConcurrentDictionary<string, byte> _walkedPackages =
            new(StringComparer.OrdinalIgnoreCase);

        // Guards against a dependency cycle re-entering resolution for the same name on this thread.
        [ThreadStatic]
        private static HashSet<string>? _inProgress;

        private static string? _globalPackagesFolder;
        private static int _hookInstalled;

        /// <summary>
        /// Installs the <see cref="AssemblyLoadContext.Resolving"/> hook (once per process) and records the
        /// NuGet global packages folder to probe. Safe to call repeatedly.
        /// </summary>
        public static void EnsureRegistered(string globalPackagesFolder)
        {
            if (string.IsNullOrEmpty(globalPackagesFolder))
            {
                return;
            }

            Volatile.Write(ref _globalPackagesFolder, globalPackagesFolder);

            if (Interlocked.Exchange(ref _hookInstalled, 1) == 0)
            {
                AssemblyLoadContext.Default.Resolving += OnResolving;
            }
        }

        /// <summary>
        /// Records the dependency closure of the package that ships <paramref name="packageAssemblyPath"/> by
        /// walking its <c>.nuspec</c> transitively, so the resolving hook can bind each dependency to the
        /// package version NuGet would have selected.
        /// </summary>
        /// <remarks>
        /// This is required because an assembly reference carries an <em>assembly</em> version, which for many
        /// packages is deliberately lower than the <em>package</em> version that ships it. <c>System.ClientModel</c>
        /// 1.14.0, for example, ships assembly version 1.9.0.0; treating that as a package version resolves the
        /// unrelated 1.9.0 package and produces a <see cref="MissingMethodException"/> at type-load time.
        /// </remarks>
        public static void RegisterPackageClosure(string globalPackagesFolder, string packageAssemblyPath)
        {
            if (string.IsNullOrEmpty(globalPackagesFolder) || string.IsNullOrEmpty(packageAssemblyPath))
            {
                return;
            }

            // Layout is {globalPackagesFolder}/{id}/{version}/lib/{tfm}/{assembly}.dll
            var versionDir = Path.GetDirectoryName(Path.GetDirectoryName(Path.GetDirectoryName(packageAssemblyPath)));
            var packageDir = Path.GetDirectoryName(versionDir);
            if (versionDir == null || packageDir == null)
            {
                return;
            }

            WalkPackage(globalPackagesFolder, Path.GetFileName(packageDir), Path.GetFileName(versionDir));
        }

        private static void WalkPackage(string globalPackagesFolder, string packageId, string version)
        {
            if (!NuGetVersion.TryParse(version, out var parsedVersion))
            {
                return;
            }

            // Mirror NuGet's "highest version wins" unification when the same package appears more than once.
            var winner = _closureVersions.AddOrUpdate(
                packageId,
                parsedVersion,
                (_, existing) => existing >= parsedVersion ? existing : parsedVersion);
            if (winner != parsedVersion)
            {
                return;
            }

            if (!_walkedPackages.TryAdd($"{packageId}/{parsedVersion.ToNormalizedString()}", 0))
            {
                return;
            }

            var versionDir = Path.Combine(globalPackagesFolder, packageId.ToLowerInvariant(), version.ToLowerInvariant());
            string? nuspecPath;
            try
            {
                nuspecPath = Directory.Exists(versionDir)
                    ? Directory.EnumerateFiles(versionDir, "*.nuspec").FirstOrDefault()
                    : null;
            }
            catch (Exception ex)
            {
                Debug($"Failed to enumerate '{versionDir}' while walking package dependencies: {ex.Message}");
                return;
            }

            if (nuspecPath == null)
            {
                Debug($"No .nuspec found for package '{packageId}' {version}; its dependencies will not be pinned.");
                return;
            }

            IReadOnlyList<PackageDependencyGroup> groups;
            try
            {
                groups = new NuspecReader(nuspecPath).GetDependencyGroups().ToList();
            }
            catch (Exception ex)
            {
                Debug($"Failed to read '{nuspecPath}': {ex.Message}");
                return;
            }

            foreach (var dependency in SelectNearestGroup(groups))
            {
                var dependencyVersion = dependency.VersionRange?.MinVersion;
                if (dependencyVersion != null)
                {
                    WalkPackage(globalPackagesFolder, dependency.Id, dependencyVersion.ToNormalizedString());
                }
            }
        }

        private static IEnumerable<PackageDependency> SelectNearestGroup(IReadOnlyList<PackageDependencyGroup> groups)
        {
            if (groups.Count == 0)
            {
                return Array.Empty<PackageDependency>();
            }

            var nearest = new FrameworkReducer().GetNearest(NugetPackageResolver.CurrentFramework, groups.Select(g => g.TargetFramework));
            var group = nearest != null
                ? groups.FirstOrDefault(g => g.TargetFramework.Equals(nearest))
                : null;

            return group?.Packages ?? Array.Empty<PackageDependency>();
        }

        /// <summary>
        /// Clears the cached dependency resolutions. Loaded assemblies cannot be unloaded from the default
        /// context, so this only resets the probe/metadata-reference bookkeeping.
        /// </summary>
        internal static void Reset()
        {
            _resolved.Clear();
            _registeredReferences.Clear();
            _closureVersions.Clear();
            _walkedPackages.Clear();
        }

        private static Assembly? OnResolving(AssemblyLoadContext context, AssemblyName name)
        {
            var simpleName = name.Name;
            var globalPackagesFolder = Volatile.Read(ref _globalPackagesFolder);
            if (string.IsNullOrEmpty(simpleName) || string.IsNullOrEmpty(globalPackagesFolder))
            {
                return null;
            }

            if (_resolved.TryGetValue(simpleName, out var cached))
            {
                return cached;
            }

            var inProgress = _inProgress ??= new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            if (!inProgress.Add(simpleName))
            {
                return null;
            }

            try
            {
                // Prefer an assembly the host already provides, even when its version is lower than the one
                // requested. The default context only asks us to resolve a name it could not satisfy itself, but
                // it will still satisfy *other*, lower-versioned requests for that same name from its own
                // assemblies. Loading a second copy from the cache would therefore leave two assemblies with the
                // same simple name in the process, and any type they both declare (System.Memory.Data's
                // System.BinaryData, for example) would exist twice, so signatures mentioning it fail to bind
                // with a MissingMethodException. Reusing the host's copy keeps exactly one identity per name.
                var assembly = UseHostAssembly(simpleName) ?? Probe(globalPackagesFolder, simpleName, name.Version);
                _resolved[simpleName] = assembly;
                return assembly;
            }
            finally
            {
                inProgress.Remove(simpleName);
            }
        }

        /// <summary>
        /// Returns the host's own copy of <paramref name="simpleName"/> when it has one, ignoring version.
        /// </summary>
        private static Assembly? UseHostAssembly(string simpleName)
        {
            foreach (var loaded in AssemblyLoadContext.Default.Assemblies)
            {
                if (string.Equals(loaded.GetName().Name, simpleName, StringComparison.OrdinalIgnoreCase))
                {
                    Debug($"Reusing already-loaded assembly '{loaded.GetName()}' for dependency '{simpleName}'.");
                    return loaded;
                }
            }

            // Not loaded yet, but it may still be in the generator's deployment. Ask for it by simple name only,
            // which matches any version there; a version-qualified request is what failed to get us here.
            try
            {
                var assembly = AssemblyLoadContext.Default.LoadFromAssemblyName(new AssemblyName(simpleName));
                Debug($"Resolved dependency '{simpleName}' to the generator's own '{assembly.GetName()}'.");
                return assembly;
            }
            catch (Exception)
            {
                // The generator does not deploy this assembly; fall back to the NuGet cache.
                return null;
            }
        }

        private static Assembly? Probe(string globalPackagesFolder, string simpleName, Version? version)
        {
            // NuGet package ids and assembly simple names match for the overwhelming majority of packages.
            // Prefer the version recorded from the dependency closure: an assembly reference only carries an
            // assembly version, which is frequently lower than the package version that ships it, so deriving
            // a package version from it can silently bind an incompatible package.
            string? assemblyPath = null;
            if (_closureVersions.TryGetValue(simpleName, out var closureVersion))
            {
                assemblyPath = NugetPackageResolver.FindPackageAssemblyInVersion(
                    globalPackagesFolder, simpleName, closureVersion.ToNormalizedString());
                if (assemblyPath == null)
                {
                    Debug($"Dependency '{simpleName}' {closureVersion.ToNormalizedString()} is in the closure but is not installed in '{globalPackagesFolder}'.");
                }
                else
                {
                    // Dependencies of a dependency are only discoverable once we know which version won.
                    RegisterPackageClosure(globalPackagesFolder, assemblyPath);
                }
            }

            // Fall back to a version-range search, then to any cached version, for packages that were not
            // reachable through the closure (for example when a .nuspec is missing from the cache).
            if (assemblyPath == null && version != null)
            {
                assemblyPath = NugetPackageResolver.FindPackageAssembly(globalPackagesFolder, simpleName, version.ToString());
            }
            assemblyPath ??= NugetPackageResolver.FindPackageAssembly(globalPackagesFolder, simpleName);

            if (assemblyPath == null)
            {
                Debug($"Could not locate dependency assembly '{simpleName}' under '{globalPackagesFolder}'.");
                return null;
            }

            byte[] assemblyBytes;
            try
            {
                // Load from bytes so we never hold a file handle on a package in the global cache.
                assemblyBytes = File.ReadAllBytes(assemblyPath);
            }
            catch (Exception ex)
            {
                Debug($"Failed to read dependency assembly '{assemblyPath}': {ex.Message}");
                return null;
            }

            Assembly assembly;
            try
            {
                assembly = Assembly.Load(assemblyBytes);
            }
            catch (Exception ex)
            {
                Debug($"Failed to load dependency assembly '{assemblyPath}': {ex.Message}");
                return null;
            }

            // Make the dependency visible to Roslyn too, so generated code that inherits from or references
            // types declared in it still binds inside the generated-code workspace.
            if (_registeredReferences.TryAdd(assemblyPath, 0))
            {
                try
                {
                    CodeModelGenerator.Instance.AddMetadataReference(MetadataReference.CreateFromImage(assemblyBytes));
                }
                catch (Exception ex)
                {
                    Debug($"Failed to add metadata reference for dependency assembly '{assemblyPath}': {ex.Message}");
                }
            }

            Debug($"Resolved dependency assembly '{simpleName}' from '{assemblyPath}'.");
            return assembly;
        }

        private static void Debug(string message)
        {
            try
            {
                CodeModelGenerator.Instance.Emitter?.Debug(message);
            }
            catch (InvalidOperationException)
            {
                // No generator is installed (e.g. a unit test resolving types outside of a generation run).
            }
        }
    }
}
