using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using Task = System.Threading.Tasks.Task;

using Microsoft.VisualStudio.LanguageServer.Client;
using Microsoft.VisualStudio.Shell;
using Microsoft.VisualStudio.Threading;
using Microsoft.VisualStudio.Utilities;

namespace Microsoft.Adl.VisualStudio {
  [PackageRegistration(UseManagedResourcesOnly = true, AllowsBackgroundLoading = true)]
  [Guid("88b9492f-c019-492c-8aeb-f325a7e4cf23")]
  public sealed class Package : AsyncPackage { }

  public class ContentDefinition {
    [Export]
    [Name("adl")]
    [BaseDefinition(CodeRemoteContentDefinition.CodeRemoteContentTypeName)]
    public static ContentTypeDefinition AdlContentTypeDefinition;

    [Export]
    [FileExtension(".adl")]
    [ContentType("adl")]
    public static FileExtensionToContentTypeDefinition AdlFileExtensionDefinition;
  }

  [ContentType("adl")]
  [Export(typeof(ILanguageClient))]
  public class LanguageClient : ILanguageClient {
    public string Name => "ADL Language Support";
    public IEnumerable<string> ConfigurationSections => null;
    public object InitializationOptions => null;
    public IEnumerable<string> FilesToWatch => null;
    public event AsyncEventHandler<EventArgs> StartAsync;
    public event AsyncEventHandler<EventArgs> StopAsync { add { } remove { } } // unused

    public async Task<Connection> ActivateAsync(CancellationToken token) {
      await Task.Yield();

      var options = Environment.GetEnvironmentVariable("ADL_SERVER_NODE_OPTIONS");
      var info = new ProcessStartInfo {
        // Use adl-server on PATH in production
        FileName = "adl-server.cmd",
        Arguments = "--stdio",
        RedirectStandardInput = true,
        RedirectStandardOutput = true,
        UseShellExecute = false,
        CreateNoWindow = true,
        Environment = { new("NODE_OPTIONS", options) },
      };

#if DEBUG
      // Use local build of adl-server in development (lauched from F5 in VS)
      if (InDevelopmentMode()) {
        var module = GetDevelopmentAdlServerPath();
        info.FileName = "node.exe";
        info.Arguments = $"{options} {module} {info.Arguments}";
        // --nolazy isn't supported by NODE_OPTIONS so we pass these via CLI instead
        info.Environment.Remove("NODE_OPTIONS");
      }
#endif

      var process = Process.Start(info);
      return new Connection(process.StandardOutput.BaseStream, process.StandardInput.BaseStream);
    }

    public async Task OnLoadedAsync() {
      await StartAsync?.InvokeAsync(this, EventArgs.Empty);
    }

    public Task OnServerInitializeFailedAsync(Exception e) {
      return Task.CompletedTask;
    }

    public Task OnServerInitializedAsync() {
      return Task.CompletedTask;
    }

#if DEBUG
    static bool InDevelopmentMode() {
      return string.Equals(
        Environment.GetEnvironmentVariable("ADL_DEVELOPMENT_MODE"),
        "true",
        StringComparison.OrdinalIgnoreCase);
    }

    static string GetDevelopmentAdlServerPath() {
      // Even when debugging, we get deployed to an extension folder outside the source
      // tree, so we stash the source directory in a file in debug builds so we can use it
      // to run adl-server against the live developer build in the source tree.
      var thisDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
      var srcDir = File.ReadAllText(Path.Combine(thisDir, "DebugSourceDirectory.txt")).Trim();
      return Path.GetFullPath(Path.Combine(srcDir, "../adl/cmd/adl-server.js"));
    }
#endif
  }
}
