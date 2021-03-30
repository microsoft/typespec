using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using System.Diagnostics;
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

      var info = new ProcessStartInfo {
        FileName = "adl-server.cmd",
        Arguments = "--stdio",
        RedirectStandardInput = true,
        RedirectStandardOutput = true,
        UseShellExecute = false,
        CreateNoWindow = true,
      };

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
  }
}
