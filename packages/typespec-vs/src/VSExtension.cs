using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.Composition;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using EnvDTE;
using Microsoft.VisualStudio.LanguageServer.Client;
using Microsoft.VisualStudio.Shell;
using Microsoft.VisualStudio.Threading;
using Microsoft.VisualStudio.Utilities;
using Microsoft.VisualStudio.Workspace;
using Microsoft.VisualStudio.Workspace.Settings;
using Microsoft.VisualStudio.Workspace.VSIntegration.Contracts;
using Newtonsoft.Json;
using Debugger = System.Diagnostics.Debugger;
using Process = System.Diagnostics.Process;
using Task = System.Threading.Tasks.Task;

namespace Microsoft.TypeSpec.VisualStudio
{
    [PackageRegistration(UseManagedResourcesOnly = true, AllowsBackgroundLoading = true)]
    [Guid("88b9492f-c019-492c-8aeb-f325a7e4cf23")]
    [ProvideBindingPath()]
    public sealed class Package : AsyncPackage { }

    public sealed class ContentDefinition
    {
        [Export]
        [Name("typespec")]
        [BaseDefinition(CodeRemoteContentDefinition.CodeRemoteContentTypeName)]
        public ContentTypeDefinition? TypeSpecContentTypeDefinition => null;

        [Export]
        [FileExtension(".tsp")]
        [ContentType("typespec")]
        public FileExtensionToContentTypeDefinition? TypeSpecFileExtensionDefinition => null;

        [Export]
        [FileExtension(".cadl")]
        [ContentType("typespec")]
        public FileExtensionToContentTypeDefinition? CadlFileExtensionDefinition => null;
    }

    [Export(typeof(ILanguageClient))]
    [ContentType("typespec")]
    public sealed class LanguageClient : ILanguageClient
    {
        public string Name => "TypeSpec";
        public IEnumerable<string>? ConfigurationSections { get; } = new[] { "typespec" };
        public object? InitializationOptions => null;
        public bool ShowNotificationOnInitializeFailed => true;
        public IEnumerable<string> FilesToWatch { get; } = new[] { "**/*.tsp", "**/tspconfig.yaml", "**/package.json", "**/*.cadl", "**/cadl-project.yaml" };
        public event AsyncEventHandler<EventArgs>? StartAsync;
        public event AsyncEventHandler<EventArgs>? StopAsync { add { } remove { } } // unused

        private readonly IVsFolderWorkspaceService _workspaceService;
        private readonly SVsServiceProvider _serviceProvider;
        private string? _workspaceFolder;
        private string? _configuredTypeSpecServerPath;

        [ImportingConstructor]
        public LanguageClient(
            [Import] IVsFolderWorkspaceService workspaceService, [Import] SVsServiceProvider serviceProvider)
        {
            _workspaceService = workspaceService;
            _serviceProvider = serviceProvider;
        }

        public async Task<Connection?> ActivateAsync(CancellationToken token)
        {
            await LoadSettingsAsync();

            var (serverCommand, serverArgs, env) = resolveTypeSpecServer();
            var info = new ProcessStartInfo
            {
                FileName = serverCommand,
                Arguments = serverArgs,
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
                WorkingDirectory = _workspaceFolder,
            };

            foreach (var entry in env)
            {
                info.Environment.Add(entry.Key, entry.Value);
            }

            try
            {
                var process = Process.Start(info);
                process.BeginErrorReadLine();
                process.ErrorDataReceived += (_, e) => LogStderrMessage(e.Data);

                return new Connection(
                    process.StandardOutput.BaseStream,
                    process.StandardInput.BaseStream);
            }
            catch (Win32Exception e) when (e.NativeErrorCode == Win32ErrorCodes.ERROR_FILE_NOT_FOUND)
            {
                throw new TypeSpecServerNotFoundException(info.FileName, e);
            }
        }

        public async Task OnLoadedAsync()
        {
            var start = StartAsync;
            if (start != null)
            {
                await start.InvokeAsync(this, EventArgs.Empty);
            }
        }

        public Task<InitializationFailureContext?> OnServerInitializeFailedAsync(ILanguageClientInitializationInfo initializationState)
        {
            var exception = initializationState.InitializationException;
            var message = exception is TypeSpecUserErrorException ?
                exception.Message :
                $"File issue at https://github.com/microsoft/typespec\r\n\r\n{exception}";

            Debug.Assert(
                exception is TypeSpecUserErrorException,
                "Unexpected error initializing tsp-server:\r\n\r\n" + exception);

            return Task.FromResult<InitializationFailureContext?>(
                new InitializationFailureContext
                {
                    FailureMessage = "Failed to activate TypeSpec language server!\r\n" + message
                });
        }

        public Task OnServerInitializedAsync()
        {
            return Task.CompletedTask;
        }

        private void LogStderrMessage(string? message)
        {
            if (message == null || message.Length == 0)
            {
                return;
            }

            Debugger.Log(0, null, "tsp-server (stderr): " + message);
        }

#if DEBUG
        private static bool InDevelopmentMode()
        {
            return string.Equals(
                Environment.GetEnvironmentVariable("TYPESPEC_DEVELOPMENT_MODE"),
                "true",
                StringComparison.OrdinalIgnoreCase);
        }

        private static string GetDevelopmentTypeSpecServerPath()
        {
            // Even when debugging, we get deployed to an extension folder outside the
            // source tree, so we stash the source directory in a file in debug builds
            // so we can use it to run tsp-server against the live developer build in
            // the source tree.
            var thisDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
            var srcDir = File.ReadAllText(Path.Combine(thisDir, "DebugSourceDirectory.txt")).Trim();
            return Path.GetFullPath(Path.Combine(srcDir, "..", "..", "compiler", "entrypoints", "server.js"));
        }
#endif

        private (string command, string arguments, IDictionary<string, string> environment) resolveTypeSpecServer()
        {
            var env = new Dictionary<string, string>();
            var args = "--stdio";
            var options = Environment.GetEnvironmentVariable("TYPESPEC_SERVER_NODE_OPTIONS");

#if DEBUG
            // Use local build of tsp-server in development (launched from F5 in VS)
            if (InDevelopmentMode())
            {
                // NOTE: --no-lazy is not supported as environment variable, so we pass it in command line.
                var module = GetDevelopmentTypeSpecServerPath();
                return ("node.exe", $"{options} {module} {args}", env);
            }
#endif
            if (options != null && options.Length > 0)
            {
                env.Add("NODE_OPTIONS", options);
            }

            var serverPath = _configuredTypeSpecServerPath;
            if ((serverPath == null || serverPath.Length == 0) && _workspaceFolder != null && _workspaceFolder.Length > 0)
            {
                serverPath = ResolveLocalCompiler(_workspaceFolder);
            }

            if (serverPath == null || serverPath.Length == 0)
            {
                return ("tsp-server.cmd", args, env);
            }

            var variables = new Dictionary<string, string>();
            if (_workspaceFolder != null && _workspaceFolder.Length > 0)
            {
                variables.Add("workspaceFolder", _workspaceFolder);
            }

            serverPath = VariableResolver.ResolveVariables(serverPath, variables);
            serverPath = Path.GetFullPath(serverPath);

            if (!serverPath.EndsWith(".js"))
            {
                if (File.Exists(serverPath))
                {
                    var command = serverPath.EndsWith(".cmd") ? serverPath : $"${serverPath}.cmd";
                    return (command, args, env);
                }
                else
                {
                    serverPath = Path.Combine(serverPath, "cmd", "tsp-server.js");
                }
            }

            // We need to check this as the later check when process is started would
            // only trigger if node.exe is not found, not if the .js file passed to it
            // is not found.
            if (!File.Exists(serverPath))
            {
                throw new TypeSpecServerNotFoundException(serverPath);
            }

            env.Add("TYPESPEC_SKIP_COMPILER_RESOLVE", "1");
            return ("node.exe", $"{serverPath} {args}", env);
        }

        private string? ResolveLocalCompiler(string baseDir)
        {
            var current = baseDir;
            while (current != null)
            {
                var potentialInstallDir = Path.Combine(current, "node_modules", "@typespec", "compiler");
                if (Directory.Exists(potentialInstallDir))
                {
                    return potentialInstallDir;
                }
                current = Path.GetDirectoryName(current);
            }
            return null;
        }

        private async Task LoadSettingsAsync()
        {
            var workspace = _workspaceService.CurrentWorkspace;
            if (workspace != null)
            {
                // Use workspace manager when there is a workspace.
                var settings = workspace.GetSettingsManager()?.GetAggregatedSettings(SettingsTypes.Generic);
                _configuredTypeSpecServerPath = settings?.Property<string>("typespec.tsp-server.path");
                _workspaceFolder = workspace.Location;
            }
            else
            {
                // When a solution is open, read the settings ourselves.
                _workspaceFolder = await GetSolutionFolderAsync();
                var settings = ReadSettingsFromJson(_workspaceFolder);
                settings.TryGetValue("typespec.tsp-server.path", out _configuredTypeSpecServerPath);
            }
        }

        private static Dictionary<string, string> ReadSettingsFromJson(string? workspaceFolder)
        {
            var empty = new Dictionary<string, string>();
            if (workspaceFolder == null || workspaceFolder.Length == 0)
            {
                return empty;
            }

            var settingsPath = Path.Combine(workspaceFolder, ".vs", "VSWorkspaceSettings.json");
            if (!File.Exists(settingsPath))
            {
                return empty;
            }

            try
            {
                var text = File.ReadAllText(settingsPath);
                var json = JsonConvert.DeserializeObject<Dictionary<string, object>>(text);
                return json == null ? empty : json.Where((e) => e.Value is string).ToDictionary(e => e.Key, e => (string)e.Value);
            }
            catch (Exception e) when (e is IOException || e is UnauthorizedAccessException || e is JsonException)
            {
                throw new TypeSpecUserErrorException($"Error reading {settingsPath}: {e.Message}", e);
            }
        }

        private async Task<string?> GetSolutionFolderAsync()
        {
            await ThreadHelper.JoinableTaskFactory.SwitchToMainThreadAsync();
            var dte = (DTE)_serviceProvider.GetService(typeof(DTE));

            string? folder = null;
            if (dte != null && dte.Solution != null)
            {
                folder = Path.GetDirectoryName(dte.Solution.FullName);
            }

            await TaskScheduler.Default; //return to thread pool thread
            return folder;
        }
    }
}
