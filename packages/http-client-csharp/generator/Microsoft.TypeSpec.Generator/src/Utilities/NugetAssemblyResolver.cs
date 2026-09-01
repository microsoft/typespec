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
    /// <para>
    /// One instance services one generation run and is owned by that run's resolver cache state. The
    /// only genuinely process-wide pieces are kept static and documented below: the default context's
    /// single <c>Resolving</c> event, and the fact that assemblies loaded into it can never be unloaded.
    /// </para>
    /// </remarks>
    internal sealed class NugetAssemblyResolver
    {
        // The default AssemblyLoadContext exposes exactly one process-wide Resolving event, so the handler is
        // installed once and dispatches to whichever resolver is currently servicing a generation run. Keeping
        // the subscription static rather than per-instance means repeated runs in one process - the norm under
        // test - cannot accumulate handlers.
        private static int _hookInstalled;
        private static NugetAssemblyResolver? _active;

        private readonly string _globalPackagesFolder;
        private readonly Action<string> _debug;
        private readonly Action<MetadataReference> _addMetadataReference;

        // Cached resolution per assembly simple name. A null value means resolution was attempted and
        // failed, so repeated references to the same missing dependency don't re-probe the file system.
        private readonly ConcurrentDictionary<string, Assembly?> _resolved =
            new(StringComparer.OrdinalIgnoreCase);

        // Tracks assembly paths already registered as Roslyn metadata references.
        private readonly ConcurrentDictionary<string, byte> _registeredReferences =
            new(StringComparer.OrdinalIgnoreCase);

        // Package id -> package version, for every package in the dependency closure of an external-type
        // package. Populated from .nuspec files so dependencies bind to the version NuGet would have
        // chosen rather than a version guessed from the referencing assembly's version number.
        private readonly ConcurrentDictionary<string, NuGetVersion> _closureVersions =
            new(StringComparer.OrdinalIgnoreCase);

        // Package version directories whose .nuspec has already been walked.
        private readonly ConcurrentDictionary<string, byte> _walkedPackages =
            new(StringComparer.OrdinalIgnoreCase);

        // Dependencies that were satisfied by an older copy the generator already deploys, keyed by simple
        // name. Surfaced in resolution failures so a type that fails to load because of the substitution
        // reports why instead of just appearing to be missing.
        private readonly ConcurrentDictionary<string, string> _downgradedDependencies =
            new(StringComparer.OrdinalIgnoreCase);

        // Guards against a dependency cycle re-entering resolution for the same name on this thread.
        private readonly ThreadLocal<HashSet<string>> _inProgress =
            new(() => new HashSet<string>(StringComparer.OrdinalIgnoreCase));

        /// <param name="globalPackagesFolder">The NuGet global packages folder to probe.</param>
        /// <param name="debug">Receives trace messages describing each resolution decision.</param>
        /// <param name="addMetadataReference">
        /// Registers a resolved dependency with the generation run's Roslyn workspaces.
        /// </param>
        public NugetAssemblyResolver(
            string globalPackagesFolder,
            Action<string> debug,
            Action<MetadataReference> addMetadataReference)
        {
            _globalPackagesFolder = globalPackagesFolder;
            _debug = debug;
            _addMetadataReference = addMetadataReference;
        }

        /// <summary>
        /// Makes this the resolver that services dependency loads the default context cannot satisfy,
        /// installing the process-wide hook on first use. Safe to call repeatedly.
        /// </summary>
        public void Activate()
        {
            Volatile.Write(ref _active, this);

            if (Interlocked.Exchange(ref _hookInstalled, 1) == 0)
            {
                AssemblyLoadContext.Default.Resolving += static (_, name) =>
                    Volatile.Read(ref _active)?.Resolve(name);
            }
        }

        /// <summary>
        /// Stops routing dependency loads to any resolver. Assemblies already loaded into the default
        /// context stay loaded - they cannot be unloaded - so this only detaches the bookkeeping.
        /// </summary>
        public static void Deactivate() => Volatile.Write(ref _active, null);

        /// <summary>
        /// Describes the dependencies that were satisfied by an older copy shipped with the generator, or
        /// <c>null</c> when every dependency was resolved at or above the version that was asked for.
        /// </summary>
        public string? DescribeDowngradedDependencies() =>
            _downgradedDependencies.IsEmpty
                ? null
                : string.Join("; ", _downgradedDependencies.Values.OrderBy(v => v, StringComparer.Ordinal));

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
        public void RegisterPackageClosure(string packageAssemblyPath)
        {
            if (string.IsNullOrEmpty(packageAssemblyPath))
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

            WalkPackage(Path.GetFileName(packageDir), Path.GetFileName(versionDir));
        }

        private void WalkPackage(string packageId, string version)
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

            if (!NugetPackageResolver.TryFindPackageInCache(
                _globalPackagesFolder,
                packageId,
                parsedVersion,
                out var packageInfo))
            {
                _debug($"Package '{packageId}' {version} was not found while walking package dependencies.");
                return;
            }

            string? nuspecPath;
            try
            {
                nuspecPath = Directory.EnumerateFiles(packageInfo.ExpandedPath, "*.nuspec").FirstOrDefault();
            }
            catch (Exception ex)
            {
                _debug($"Failed to enumerate '{packageInfo.ExpandedPath}' while walking package dependencies: {ex.Message}");
                return;
            }

            if (nuspecPath == null)
            {
                _debug($"No .nuspec found for package '{packageId}' {version}; its dependencies will not be pinned.");
                return;
            }

            IReadOnlyList<PackageDependencyGroup> groups;
            try
            {
                groups = new NuspecReader(nuspecPath).GetDependencyGroups().ToList();
            }
            catch (Exception ex)
            {
                _debug($"Failed to read '{nuspecPath}': {ex.Message}");
                return;
            }

            foreach (var dependency in SelectNearestGroup(groups))
            {
                var dependencyVersion = dependency.VersionRange?.MinVersion;
                if (dependencyVersion != null)
                {
                    WalkPackage(dependency.Id, dependencyVersion.ToNormalizedString());
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

        internal Assembly? Resolve(AssemblyName name)
        {
            var simpleName = name.Name;
            if (string.IsNullOrEmpty(simpleName) || string.IsNullOrEmpty(_globalPackagesFolder))
            {
                return null;
            }

            if (_resolved.TryGetValue(simpleName, out var cached))
            {
                return cached;
            }

            var inProgress = _inProgress.Value!;
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
                var assembly = UseHostAssembly(simpleName, name.Version) ?? Probe(simpleName, name.Version);
                _resolved[simpleName] = assembly;
                return assembly;
            }
            finally
            {
                inProgress.Remove(simpleName);
            }
        }

        /// <summary>
        /// Returns the host's own copy of <paramref name="simpleName"/> when it has one, regardless of version,
        /// recording a downgrade when that copy is older than the version that was requested.
        /// </summary>
        private Assembly? UseHostAssembly(string simpleName, Version? requestedVersion)
        {
            var hostAssembly = FindHostAssembly(simpleName);
            if (hostAssembly == null)
            {
                return null;
            }

            var hostVersion = hostAssembly.GetName().Version;
            if (requestedVersion != null && hostVersion != null && hostVersion < requestedVersion)
            {
                // Not fatal on its own: assembly versions are routinely older than the reference that names
                // them, and using the host's copy is the only option that keeps one identity per simple name.
                // It is recorded so that a type which does fail to load can say why.
                var note =
                    $"'{simpleName}' was requested at version {requestedVersion} but the generator supplies " +
                    $"{hostVersion}, which was used to keep a single identity for the types it declares";
                if (_downgradedDependencies.TryAdd(simpleName, note))
                {
                    _debug($"Dependency version downgrade: {note}.");
                }
            }
            else
            {
                _debug($"Reusing the generator's '{hostAssembly.GetName()}' for dependency '{simpleName}'.");
            }

            return hostAssembly;
        }

        private static Assembly? FindHostAssembly(string simpleName)
        {
            foreach (var loaded in AssemblyLoadContext.Default.Assemblies)
            {
                if (string.Equals(loaded.GetName().Name, simpleName, StringComparison.OrdinalIgnoreCase))
                {
                    return loaded;
                }
            }

            // Not loaded yet, but it may still be in the generator's deployment. Ask for it by simple name only,
            // which matches any version there; a version-qualified request is what failed to get us here.
            try
            {
                return AssemblyLoadContext.Default.LoadFromAssemblyName(new AssemblyName(simpleName));
            }
            catch (Exception)
            {
                // The generator does not deploy this assembly; fall back to the NuGet cache.
                return null;
            }
        }

        private Assembly? Probe(string simpleName, Version? version)
        {
            // NuGet package ids and assembly simple names match for the overwhelming majority of packages.
            // Prefer the version recorded from the dependency closure: an assembly reference only carries an
            // assembly version, which is frequently lower than the package version that ships it, so deriving
            // a package version from it can silently bind an incompatible package.
            string? assemblyPath = null;
            if (_closureVersions.TryGetValue(simpleName, out var closureVersion))
            {
                assemblyPath = NugetPackageResolver.FindPackageAssemblyInVersion(
                    _globalPackagesFolder, simpleName, closureVersion.ToNormalizedString());
                if (assemblyPath == null)
                {
                    _debug($"Dependency '{simpleName}' {closureVersion.ToNormalizedString()} is in the closure but is not installed in '{_globalPackagesFolder}'.");
                }
                else
                {
                    // Dependencies of a dependency are only discoverable once we know which version won.
                    RegisterPackageClosure(assemblyPath);
                }
            }

            // Fall back to a version-range search, then to any cached version, for packages that were not
            // reachable through the closure (for example when a .nuspec is missing from the cache).
            if (assemblyPath == null && version != null)
            {
                assemblyPath = NugetPackageResolver.FindPackageAssembly(_globalPackagesFolder, simpleName, version.ToString());
            }
            assemblyPath ??= NugetPackageResolver.FindPackageAssembly(_globalPackagesFolder, simpleName);

            if (assemblyPath == null)
            {
                _debug($"Could not locate dependency assembly '{simpleName}' under '{_globalPackagesFolder}'.");
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
                _debug($"Failed to read dependency assembly '{assemblyPath}': {ex.Message}");
                return null;
            }

            Assembly assembly;
            try
            {
                assembly = Assembly.Load(assemblyBytes);
            }
            catch (Exception ex)
            {
                _debug($"Failed to load dependency assembly '{assemblyPath}': {ex.Message}");
                return null;
            }

            // Make the dependency visible to Roslyn too, so generated code that inherits from or references
            // types declared in it still binds inside the generated-code workspace.
            if (_registeredReferences.TryAdd(assemblyPath, 0))
            {
                try
                {
                    _addMetadataReference(MetadataReference.CreateFromImage(assemblyBytes));
                }
                catch (Exception ex)
                {
                    _debug($"Failed to add metadata reference for dependency assembly '{assemblyPath}': {ex.Message}");
                }
            }

            _debug($"Resolved dependency assembly '{simpleName}' from '{assemblyPath}'.");
            return assembly;
        }
    }
}
