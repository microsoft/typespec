// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using System.ComponentModel.Composition.Hosting;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Threading.Tasks;
using System.Xml.Linq;
using Microsoft.TypeSpec.Generator.EmitterRpc;
using Microsoft.TypeSpec.Generator.Utilities;

namespace Microsoft.TypeSpec.Generator
{
    internal class GeneratorHandler
    {
        private const string NodeModulesDir = "node_modules";
        private const string SrcDir = "src";
        private const string PluginOutputRootDirName = "typespec-generator-plugins";

        public void LoadGenerator(CommandLineOptions options)
        {
            using DirectoryCatalog directoryCatalog = new(AppContext.BaseDirectory);
            using AggregateCatalog catalog = new(directoryCatalog);

            AddPluginDlls(catalog);

            // Load plugins specified via the 'plugins' configuration option
            var configuration = Configuration.Load(options.OutputDirectory);
            AddConfiguredPluginDlls(catalog, configuration);

            using CompositionContainer container = new(catalog);

            container.ComposeExportedValue(new GeneratorContext(configuration));
            container.ComposeParts(this);

            SelectGenerator(options);
        }

        private static void AddPluginDlls(AggregateCatalog catalog)
        {
            string? rootDirectory = FindRootDirectory(AppContext.BaseDirectory);
            if (rootDirectory == null)
            {
                return;
            }

            var packagePath = Path.Combine(rootDirectory, "package.json");
            if (!File.Exists(packagePath))
            {
                return;
            }

            using var doc = JsonDocument.Parse(File.ReadAllText(packagePath));
            if (!doc.RootElement.TryGetProperty("dependencies", out var deps))
            {
                return;
            }

            // We need to construct the emitter independently as the CodeModelGenerator is not yet initialized.
            using var emitter = new Emitter(Console.OpenStandardOutput());

            var packageNamesInOrder = deps.EnumerateObject().Select(p => p.Name).ToList();
            var dllPathsInOrder = new List<string>();

            foreach (var package in packageNamesInOrder)
            {
                var packageDir = GetPackageDirectory(rootDirectory, package);
                var packageDistPath = Path.Combine(packageDir, "dist");

                if (Directory.Exists(packageDistPath))
                {
                    var dlls = Directory.EnumerateFiles(packageDistPath, "*.dll", SearchOption.AllDirectories);
                    dllPathsInOrder.AddRange(dlls);
                }
                else
                {
                    // No pre-built DLLs — look for a .csproj to build
                    var builtDll = BuildPluginIfNeeded(packageDir, emitter);
                    if (builtDll != null)
                    {
                        dllPathsInOrder.Add(builtDll);
                    }
                }
            }

            if (dllPathsInOrder.Count == 0)
            {
                return;
            }

            var highestVersions = new Dictionary<string, (Version Version, string Path)>(StringComparer.OrdinalIgnoreCase);
            foreach (var dllPath in dllPathsInOrder)
            {
                try
                {
                    var asmName = AssemblyName.GetAssemblyName(dllPath);
                    var fullName = asmName.FullName;
                    var version = asmName.Version!;

                    if (!highestVersions.TryGetValue(fullName, out var existing) || version > existing.Version)
                    {
                        highestVersions[fullName] = (version, dllPath);
                    }
                }
                catch (Exception ex)
                {
                    emitter.Info($"Warning: Could not read assembly info from {dllPath}: {ex.Message}");
                }
            }

            // Setup assembly resolver for transitive dependencies
            AppDomain.CurrentDomain.AssemblyResolve += (sender, args) =>
            {
                if (highestVersions.TryGetValue(args.Name, out var entry))
                {
                    return Assembly.LoadFrom(entry.Path);
                }
                return null;
            };

            // Load each highest-version DLL into the catalog
            foreach (KeyValuePair<string, (Version Version, string Path)> kvp in highestVersions)
            {
                try
                {
                    catalog.Catalogs.Add(new AssemblyCatalog(kvp.Value.Path));
                }
                catch (Exception ex)
                {
                    emitter.Info($"Warning: Failed to load catalog for {kvp.Value.Path}: {ex.Message}");
                }
            }
        }

        /// <summary>
        /// Loads plugin assemblies from directory paths specified via the 'plugins' configuration option.
        /// If a directory contains a .csproj file, the project is built first to produce the plugin assembly.
        /// </summary>
        internal static void AddConfiguredPluginDlls(AggregateCatalog catalog, Configuration configuration)
        {
            var pluginPaths = configuration.PluginPaths;
            if (pluginPaths == null || pluginPaths.Count == 0)
            {
                return;
            }

            using var emitter = new Emitter(Console.OpenStandardOutput());

            foreach (var pluginPath in pluginPaths)
            {
                if (string.IsNullOrEmpty(pluginPath))
                {
                    continue;
                }

                if (!Directory.Exists(pluginPath))
                {
                    throw new InvalidOperationException(
                        $"Plugin path '{pluginPath}' is not a valid directory.");
                }

                var builtDll = BuildPluginIfNeeded(pluginPath, emitter);
                if (builtDll != null)
                {
                    catalog.Catalogs.Add(new AssemblyCatalog(builtDll));
                }
                else
                {
                    // No .csproj found — scan for pre-built DLLs
                    foreach (var dll in Directory.EnumerateFiles(pluginPath, "*.dll"))
                    {
                        try
                        {
                            catalog.Catalogs.Add(new AssemblyCatalog(dll));
                        }
                        catch
                        {
                            // Skip DLLs that can't be loaded as MEF catalogs (e.g. native DLLs)
                        }
                    }
                }
            }
        }

        /// <summary>
        /// Looks for a .csproj in the given directory (recursively) and builds it if found.
        /// Returns the path to the built DLL, or null if no .csproj was found.
        /// </summary>
        internal static string? BuildPluginIfNeeded(string directory, Emitter emitter)
        {
            var csprojPath = FindPluginProject(directory);
            if (csprojPath == null)
            {
                return null;
            }

            return BuildPlugin(csprojPath, emitter);
        }

        /// <summary>
        /// Selects the plugin project to build from <paramref name="directory"/>.
        /// A plugin directory may contain multiple projects. This method prefers a project under
        /// a 'src' directory to avoid building a test or sample project, and returns a
        /// deterministic result that is stable across platforms and filesystems.
        /// </summary>
        internal static string? FindPluginProject(string directory)
        {
            // Fast path: search a top-level 'src' directory first.
            var srcDirectory = Path.Combine(directory, SrcDir);
            if (Directory.Exists(srcDirectory))
            {
                var srcProject = SelectDeterministic(
                    Directory.EnumerateFiles(srcDirectory, "*.csproj", SearchOption.AllDirectories));
                if (srcProject != null)
                {
                    return srcProject;
                }
            }

            // Fall back to a full recursive search.
            var allProjects = Directory
                .EnumerateFiles(directory, "*.csproj", SearchOption.AllDirectories)
                .ToArray();
            if (allProjects.Length == 0)
            {
                return null;
            }

            return SelectDeterministic(allProjects.Where(path => ContainsDirectorySegment(path, SrcDir)))
                ?? SelectDeterministic(allProjects);
        }

        /// <summary>
        /// Builds the path to a package's directory under 'node_modules'.
        /// Scoped package names (e.g. '@scope/name') use a forward slash that must be split into
        /// separate path segments and recombined with the platform separator. Otherwise the forward
        /// slash is preserved verbatim on Windows, producing a mixed-separator path that fails once
        /// the path is long enough for the runtime to apply the '\\?\' extended-length prefix, which
        /// requires canonical backslash separators.
        /// </summary>
        internal static string GetPackageDirectory(string rootDirectory, string package)
        {
            var packageSegments = package.Split('/', '\\');
            var segments = new string[packageSegments.Length + 2];
            segments[0] = rootDirectory;
            segments[1] = NodeModulesDir;
            packageSegments.CopyTo(segments, 2);
            return Path.Combine(segments);
        }

        private static string? SelectDeterministic(IEnumerable<string> paths) =>
            paths.OrderBy(path => path, StringComparer.Ordinal).FirstOrDefault();

        /// <summary>
        /// Builds a plugin .csproj into a process-isolated output directory and returns the path
        /// to the built assembly, or <see langword="null"/> if the build failed or no assembly
        /// could be located.
        /// </summary>
        /// <remarks>
        /// Within a single solution folder the emitter runs once per referenced project, so the
        /// same plugin can be built concurrently by multiple processes. Sharing the plugin's
        /// 'bin'/'obj' output across those processes races: the assembly can be truncated
        /// mid-write, restore can corrupt 'project.assets.json', or a stale assembly from a
        /// previous run can be loaded — which silently drops the plugin's behavior (for example,
        /// visitors that add attributes). Redirecting each process to its own output directory
        /// removes the shared resource entirely, so builds stay fully parallel and the loaded
        /// assembly is always the one this process just built.
        /// </remarks>
        internal static string? BuildPlugin(string csprojPath, Emitter emitter)
        {
            emitter.Info($"Building plugin: {csprojPath}");

            var outputRoot = CreateIsolatedPluginOutputDirectory(csprojPath);
            var binDirectory = EnsureTrailingSeparator(Path.Combine(outputRoot, "bin"));
            var objDirectory = EnsureTrailingSeparator(Path.Combine(outputRoot, "obj"));

            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "dotnet",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                }
            };

            // Override the *base* output/intermediate paths (rather than 'OutputPath'/'--output')
            // so that multi-targeted plugin projects keep their per-framework subfolders and any
            // project that derives its output location from these base paths is still honored.
            // Command-line global properties take precedence over values set within the project or
            // its imports, so this reliably redirects the build regardless of repository layout.
            // ArgumentList is used to avoid the Windows trailing-backslash quoting pitfall.
            process.StartInfo.ArgumentList.Add("build");
            process.StartInfo.ArgumentList.Add(csprojPath);
            process.StartInfo.ArgumentList.Add("-c");
            process.StartInfo.ArgumentList.Add("Release");
            process.StartInfo.ArgumentList.Add($"-p:BaseOutputPath={binDirectory}");
            process.StartInfo.ArgumentList.Add($"-p:BaseIntermediateOutputPath={objDirectory}");
            AppendMsBuildPropertyIfSet(process.StartInfo.ArgumentList, "RestoreConfigFile", "RestoreConfigFile");
            AppendMsBuildPropertyIfSet(process.StartInfo.ArgumentList, "NuGetAudit", "NuGetAudit");

            process.Start();
            // Read both streams to avoid deadlocks. 'dotnet build' writes build/compiler
            // errors to standard output rather than standard error, so we include both when
            // reporting a failure.
            var (stdout, stderr) = ReadProcessOutput(process);

            if (process.ExitCode != 0)
            {
                // Report a warning rather than an error so that a failed plugin build does not
                // abort the entire generation; callers treat a null result as "no assembly to
                // load" and continue. Because the output directory is isolated per process, there
                // is no shared artifact to fall back to, so a failed build simply yields no plugin.
                emitter.ReportDiagnostic(
                    DiagnosticCodes.PluginBuildFailed,
                    $"Failed to build plugin '{csprojPath}'. Exit code: {process.ExitCode}\n{stdout}\n{stderr}",
                    severity: EmitterDiagnosticSeverity.Warning);
                return null;
            }

            // Scan only this process's isolated output directory so we never pick up an assembly
            // produced by a concurrent build of the same plugin.
            var dllPath = FindPluginAssembly(csprojPath, binDirectory);
            if (dllPath != null)
            {
                emitter.Info($"Plugin built: {dllPath}");
                return dllPath;
            }

            emitter.Info($"Warning: Build succeeded but could not locate the output DLL for '{csprojPath}'");
            return null;
        }

        internal static (string StandardOutput, string StandardError) ReadProcessOutput(Process process)
        {
            var stdoutTask = process.StandardOutput.ReadToEndAsync();
            var stderrTask = process.StandardError.ReadToEndAsync();
            process.WaitForExit();
            Task.WaitAll(stdoutTask, stderrTask);
            return (stdoutTask.Result, stderrTask.Result);
        }

        private static void AppendMsBuildPropertyIfSet(
            System.Collections.ObjectModel.Collection<string> argumentList,
            string envVarName,
            string propertyName)
        {
            var value = Environment.GetEnvironmentVariable(envVarName, EnvironmentVariableTarget.Process);
            if (!string.IsNullOrWhiteSpace(value))
            {
                argumentList.Add($"-p:{propertyName}={value}");
            }
        }

        /// <summary>
        /// Creates a unique, process-isolated directory to hold a plugin build's 'bin' and 'obj'
        /// output. The directory is keyed on the process id and a GUID so that concurrent
        /// generations never share build output for the same plugin.
        /// </summary>
        private static string CreateIsolatedPluginOutputDirectory(string csprojPath)
        {
            var directory = Path.Combine(
                Path.GetTempPath(),
                PluginOutputRootDirName,
                GetAssemblyName(csprojPath),
                $"{Environment.ProcessId}-{Guid.NewGuid():N}");
            Directory.CreateDirectory(directory);

            // Best-effort cleanup when the process exits. The built assembly may still be loaded
            // (and therefore locked) at that point, so any failure to delete is ignored; the
            // operating system reclaims the temporary directory eventually.
            AppDomain.CurrentDomain.ProcessExit += (_, _) =>
            {
                try
                {
                    Directory.Delete(directory, recursive: true);
                }
                catch
                {
                    // Best effort only.
                }
            };

            return directory;
        }

        private static string EnsureTrailingSeparator(string path) =>
            path.EndsWith(Path.DirectorySeparatorChar) ? path : path + Path.DirectorySeparatorChar;

        /// <summary>
        /// Locates the assembly produced by building a plugin .csproj by scanning
        /// <paramref name="scanDirectory"/> for a DLL whose name matches the project's
        /// assembly name. Scanning is used instead of computing the output path because
        /// the build output location varies across repositories (for example, some
        /// redirect output to an 'artifacts' folder) and target frameworks, which makes
        /// a computed path unreliable.
        /// </summary>
        internal static string? FindPluginAssembly(string csprojPath, string scanDirectory)
        {
            var dllName = GetAssemblyName(csprojPath) + ".dll";

            return Directory.EnumerateFiles(scanDirectory, dllName, SearchOption.AllDirectories)
                // Skip intermediate build output under 'obj' (e.g. obj/.../ref/*.dll
                // reference assemblies), which are metadata-only and cannot be loaded.
                .FirstOrDefault(path => !ContainsDirectorySegment(path, "obj"));
        }

        /// <summary>
        /// Reads the &lt;AssemblyName&gt; from the csproj, falling back to the project file name
        /// when it is not explicitly specified.
        /// </summary>
        internal static string GetAssemblyName(string csprojPath)
        {
            try
            {
                using var stream = File.OpenRead(csprojPath);
                var doc = XDocument.Load(stream);

                var assemblyName = doc.Descendants("PropertyGroup")
                    .Select(pg => pg.Element("AssemblyName")?.Value)
                    .FirstOrDefault(value => !string.IsNullOrEmpty(value));

                if (!string.IsNullOrEmpty(assemblyName))
                {
                    return assemblyName!;
                }
            }
            catch
            {
                // Fall back to the project file name below.
            }

            return Path.GetFileNameWithoutExtension(csprojPath);
        }

        private static bool ContainsDirectorySegment(string path, string segment)
        {
            var dir = Path.GetDirectoryName(path);
            while (!string.IsNullOrEmpty(dir))
            {
                if (string.Equals(Path.GetFileName(dir), segment, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
                dir = Path.GetDirectoryName(dir);
            }
            return false;
        }

        internal static IList<string> GetOrderedPluginDlls(string pluginDirectoryStart)
        {
            var dllPathsInOrder = new List<string>();
            string? rootDirectory = FindRootDirectory(pluginDirectoryStart);
            if (rootDirectory == null)
            {
                return dllPathsInOrder;
            }

            var packagePath = Path.Combine(rootDirectory, "package.json");
            if (!File.Exists(packagePath))
            {
                return dllPathsInOrder;
            }

            using var doc = JsonDocument.Parse(File.ReadAllText(packagePath));
            if (!doc.RootElement.TryGetProperty("dependencies", out var deps))
            {
                return dllPathsInOrder;
            }

            var packageNamesInOrder = deps.EnumerateObject().Select(p => p.Name).ToList();

            foreach (var package in packageNamesInOrder)
            {
                var packageDistPath = Path.Combine(rootDirectory, NodeModulesDir, package, "dist");
                if (Directory.Exists(packageDistPath))
                {
                    var dlls = Directory.EnumerateFiles(packageDistPath, "*.dll", SearchOption.AllDirectories);
                    dllPathsInOrder.AddRange(dlls);
                }
            }

            return dllPathsInOrder;
        }

        private static string? FindRootDirectory(string startDirectory)
        {
            var dir = new DirectoryInfo(startDirectory);
            while (dir != null)
            {
                if (dir.Name == NodeModulesDir)
                {
                    return dir.Parent?.FullName;
                }

                dir = dir.Parent;
            }
            return null;
        }

        internal void SelectGenerator(CommandLineOptions options)
        {
            bool loaded = false;
            foreach (var generator in Generators!)
            {
                if (generator.Metadata.GeneratorName == options.GeneratorName!)
                {
                    CodeModelGenerator.Instance = generator.Value;
                    CodeModelGenerator.Instance.IsNewProject = options.IsNewProject;

                    // Apply discovered plugins (if any)
                    if (Plugins != null)
                    {
                        foreach (var plugin in Plugins)
                        {
                            plugin.Apply(CodeModelGenerator.Instance);
                        }
                    }

                    CodeModelGenerator.Instance.Configure();
                    loaded = true;
                    break;
                }
            }

            if (!loaded)
            {
                throw new InvalidOperationException($"Generator {options.GeneratorName} not found.");
            }
        }

        [ImportMany]
        public IEnumerable<Lazy<CodeModelGenerator, IMetadata>>? Generators { get; set; }

        [ImportMany]
        public IEnumerable<GeneratorPlugin>? Plugins { get; set; }
    }

    public interface IMetadata
    {
        string GeneratorName { get; }
    }
}
