using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.VisualStudio.LanguageServer.Client;
using Microsoft.VisualStudio.Shell;
using Microsoft.VisualStudio.Threading;
using Microsoft.VisualStudio.Utilities;

using Task = System.Threading.Tasks.Task;


namespace Microsoft.Cadl.VisualStudio {
  [PackageRegistration(UseManagedResourcesOnly = true, AllowsBackgroundLoading = true)]
  [Guid("88b9492f-c019-492c-8aeb-f325a7e4cf23")]
  public sealed class Package : AsyncPackage { }

  public sealed class ContentDefinition {
    [Export]
    [Name("cadl")]
    [BaseDefinition(CodeRemoteContentDefinition.CodeRemoteContentTypeName)]
    public ContentTypeDefinition? CadlContentTypeDefinition => null;

    [Export]
    [FileExtension(".cadl")]
    [ContentType("cadl")]
    public FileExtensionToContentTypeDefinition? CadlFileExtensionDefinition => null;
  }

  [Export(typeof(ILanguageClient))]
  [ContentType("cadl")]
  public sealed class LanguageClient : ILanguageClient {
    public string Name => "Cadl";
    public IEnumerable<string>? ConfigurationSections => null;
    public object? InitializationOptions => null;
    public IEnumerable<string> FilesToWatch { get; } = new[] { "**/*.cadl", "**/package.json" };
    public event AsyncEventHandler<EventArgs>? StartAsync;
    public event AsyncEventHandler<EventArgs>? StopAsync { add { } remove { } } // unused

    public async Task<Connection?> ActivateAsync(CancellationToken token) {
      await Task.Yield();

      var options = Environment.GetEnvironmentVariable("CADL_SERVER_NODE_OPTIONS");
      var info = new ProcessStartInfo {
        // Use cadl-server on PATH in production
        FileName = "cadl-server.cmd",
        Arguments = "--stdio",
        RedirectStandardInput = true,
        RedirectStandardOutput = true,
        RedirectStandardError = true,
        UseShellExecute = false,
        CreateNoWindow = true,
        Environment = { new("NODE_OPTIONS", options) },
      };

#if DEBUG
      // Use local build of cadl-server in development (lauched from F5 in VS)
      if (InDevelopmentMode()) {
        var module = GetDevelopmentCadlServerPath();
        info.FileName = "node.exe";
        info.Arguments = $"{options} {module} {info.Arguments}";
        // --nolazy isn't supported by NODE_OPTIONS so we pass these via CLI instead
        info.Environment.Remove("NODE_OPTIONS");
      }
#endif

      var process = Process.Start(info);
      process.BeginErrorReadLine();
      process.ErrorDataReceived += (_, e) => LogStderrMessage(e.Data);

      return new Connection(
        process.StandardOutput.BaseStream,
        process.StandardInput.BaseStream);
    }

    public async Task OnLoadedAsync() {
      var start = StartAsync;
      if (start is not null) {
        await start.InvokeAsync(this, EventArgs.Empty);
      }
    }

    public Task OnServerInitializeFailedAsync(Exception e) {
      Debug.Fail("Failed to initialize cadl-server:\r\n\r\n" + e);
      return Task.CompletedTask;
    }

    public Task OnServerInitializedAsync() {
      return Task.CompletedTask;
    }

    private void LogStderrMessage(string? message) {
      if (message is null || message.Length == 0) {
        return;
      }

      // Normally logging from language server should come through LSP. If something
      // gets here via stderr (besides the messages from node about the debugger),
      // there's probably a bug.
      Debugger.Log(0, null, "cadl-server (stderr): " + message);
      Debug.Assert(
        message.IndexOf("debugger", StringComparison.OrdinalIgnoreCase) >= 0 || 
        message.IndexOf("https://nodejs.org/en/docs/inspector", StringComparison.Ordinal) >= 0,
        "Unexpected output on stderr from cadl-server: " + message);
    }

#if DEBUG
    private static bool InDevelopmentMode() {
      return string.Equals(
        Environment.GetEnvironmentVariable("CADL_DEVELOPMENT_MODE"),
        "true",
        StringComparison.OrdinalIgnoreCase);
    }

    private static string GetDevelopmentCadlServerPath() {
      // Even when debugging, we get deployed to an extension folder outside the
      // source tree, so we stash the source directory in a file in debug builds
      // so we can use it to run cadl-server against the live developer build in
      // the source tree.
      var thisDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
      var srcDir = File.ReadAllText(Path.Combine(thisDir, "DebugSourceDirectory.txt")).Trim();
      return Path.GetFullPath(Path.Combine(srcDir, "../cadl/cmd/cadl-server.js"));
    }
#endif
  }
}
