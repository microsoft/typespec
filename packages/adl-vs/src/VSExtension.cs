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
using Microsoft.VisualStudio.Shell.Interop;
using Microsoft.VisualStudio.Threading;
using Microsoft.VisualStudio.Utilities;

using Task = System.Threading.Tasks.Task;
using IAsyncServiceProvider = Microsoft.VisualStudio.Shell.IAsyncServiceProvider;

namespace Microsoft.Adl.VisualStudio {
  [PackageRegistration(UseManagedResourcesOnly = true, AllowsBackgroundLoading = true)]
  [Guid("88b9492f-c019-492c-8aeb-f325a7e4cf23")]
  public sealed class Package : AsyncPackage { }

  public sealed class ContentDefinition {
    [Export]
    [Name("adl")]
    [BaseDefinition(CodeRemoteContentDefinition.CodeRemoteContentTypeName)]
    public ContentTypeDefinition? AdlContentTypeDefinition => null;

    [Export]
    [FileExtension(".adl")]
    [ContentType("adl")]
    public FileExtensionToContentTypeDefinition? AdlFileExtensionDefinition => null;
  }

  [Export(typeof(ILanguageClient))]
  [ContentType("adl")]
  public sealed class LanguageClient : ILanguageClient {
    public string Name => "ADL Language Support";
    public IEnumerable<string>? ConfigurationSections => null;
    public object? InitializationOptions => null;
    public IEnumerable<string>? FilesToWatch => null;
    public event AsyncEventHandler<EventArgs>? StartAsync;
    public event AsyncEventHandler<EventArgs>? StopAsync { add { } remove { } } // unused

    private readonly IOutputWindow _outputWindow;

    [ImportingConstructor]
    public LanguageClient(IOutputWindow window) {
      _outputWindow = window;
    }

    public async Task<Connection> ActivateAsync(CancellationToken token) {
      await Task.Yield();

      var options = Environment.GetEnvironmentVariable("ADL_SERVER_NODE_OPTIONS");
      var info = new ProcessStartInfo {
        // Use adl-server on PATH in production
        FileName = "adl-server.cmd",
        Arguments = "--stdio",
        RedirectStandardInput = true,
        RedirectStandardOutput = true,
        RedirectStandardError = true,
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
      process.BeginErrorReadLine();
      process.ErrorDataReceived += (_, e) => LogMessage(e.Data);

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
      return Task.CompletedTask;
    }

    public Task OnServerInitializedAsync() {
      return Task.CompletedTask;
    }

    private void LogMessage(string? message) {
      if (message is null || message.Length == 0) {
        return;
      }

      Debug.WriteLine("ADL Server: " + message);
      _outputWindow.LogMessage(message);
    }

#if DEBUG
    private static bool InDevelopmentMode() {
      return string.Equals(
        Environment.GetEnvironmentVariable("ADL_DEVELOPMENT_MODE"),
        "true",
        StringComparison.OrdinalIgnoreCase);
    }

    private static string GetDevelopmentAdlServerPath() {
      // Even when debugging, we get deployed to an extension folder outside the
      // source tree, so we stash the source directory in a file in debug builds
      // so we can use it to run adl-server against the live developer build in
      // the source tree.
      var thisDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
      var srcDir = File.ReadAllText(Path.Combine(thisDir, "DebugSourceDirectory.txt")).Trim();
      return Path.GetFullPath(Path.Combine(srcDir, "../adl/cmd/adl-server.js"));
    }
#endif
  }

  public interface IOutputWindow {
    void LogMessage(string message);
  }

  [Export(typeof(IOutputWindow))]
  internal sealed class OutputWindow : IOutputWindow {
    private static readonly Guid _guid = new("{2C6CA609-4EC9-4AEE-B163-AFF26503CAA4}");
    private readonly IAsyncServiceProvider _serviceProvider;
    private readonly JoinableTaskContext _context;
    private readonly AsyncLazy<IVsOutputWindowPane?> _pane;

    [ImportingConstructor]
    public OutputWindow(
      [Import(typeof(SAsyncServiceProvider))]
      IAsyncServiceProvider serviceProvider,
      JoinableTaskContext context
    ) {
      _serviceProvider = serviceProvider;
      _context = context;
      _pane = new AsyncLazy<IVsOutputWindowPane?>(CreateOutputWindowAsync, context.Factory);
    }

    public void LogMessage(string message) {
      message += Environment.NewLine;

      // If the volume of log messages ever gets high, we'd need to batch them
      // to avoid creating too much pending async work by doing this threading
      // dance for every message.
      Task.Run(async () => {
        await _context.Factory.SwitchToMainThreadAsync();

        var pane = await _pane.GetValueAsync();
        if (pane is null) {
          return;
        }

        if (pane is IVsOutputWindowPaneNoPump paneNoPump) {
          paneNoPump.OutputStringNoPump(message);
        } else {
          var hr = pane.OutputStringThreadSafe(message);
          if (Failed(hr)) {
            return;
          }
        }
      }).Forget();
    }

    private async Task<IVsOutputWindowPane?> CreateOutputWindowAsync() {
      await _context.Factory.SwitchToMainThreadAsync();

      var window = await _serviceProvider.GetServiceAsync<SVsOutputWindow, IVsOutputWindow>();
      if (window is null) {
        return null;
      }

      // Creating an output window pane activates it, and we don't want to do
      // that, so we have to take steps to restore the active pane here.
      var activePane = GetActivePane(window);

      var pane = CreateOutputWindowPane(window);
      if (pane is null) {
        return null;
      }

      if (activePane != Guid.Empty) {
        ActivatePane(window, activePane);
      }

      return pane;
    }

    private static void ActivatePane(IVsOutputWindow window, Guid guid) {
      ThreadHelper.ThrowIfNotOnUIThread();

      var hr = window.GetPane(ref guid, out var pane);
      if (Failed(hr)) {
        return;
      }

      hr = pane.Activate();
      if (Failed(hr)) {
        return;
      }
    }

    private static Guid GetActivePane(IVsOutputWindow window) {
      ThreadHelper.ThrowIfNotOnUIThread();

      if (window is not IVsOutputWindow2 window2) {
        return Guid.Empty;
      }

      var hr = window2.GetActivePaneGUID(out var guid);
      if (Failed(hr)) {
        return Guid.Empty;
      }

      return guid;
    }

    private static IVsOutputWindowPane? CreateOutputWindowPane(IVsOutputWindow window) {
      ThreadHelper.ThrowIfNotOnUIThread();

      var guid = _guid;
      var hr = window.CreatePane(ref guid, "ADL", 1, 0);
      if (Failed(hr)) {
        return null;
      }

      hr = window.GetPane(ref guid, out var pane);
      if (Failed(hr)) {
        return null;
      }

      return pane;
    }

    private static bool Failed(int hr) {
      return hr < 0;
    }
  }
}
