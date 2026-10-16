using System;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.IO.Pipelines;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.ServiceHub.Framework;
using Microsoft.VisualStudio;
using Microsoft.VisualStudio.Extensibility;
using Microsoft.VisualStudio.Extensibility.Editor;
using Microsoft.VisualStudio.Extensibility.LanguageServer;
using Microsoft.VisualStudio.Extensibility.Shell;
using Microsoft.VisualStudio.RpcContracts.LanguageServerProvider;
using Microsoft.VisualStudio.RpcContracts.Solution;
using Nerdbank.Streams;

namespace Microsoft.TypeSpec.VisualStudio;

// cspell:ignore VSEXTPREVIEW
#pragma warning disable VSEXTPREVIEW_LSP
[VisualStudioContribution]
public sealed class TypeSpecLanguageServerProvider : LanguageServerProvider
{
    private readonly IServiceBroker _serviceBroker;
    private readonly TraceSource _traceSource;
    private Process? _process;

    public TypeSpecLanguageServerProvider(IServiceBroker serviceBroker, TraceSource traceSource)
    {
        _serviceBroker = serviceBroker;
        _traceSource = traceSource;
    }

    [VisualStudioContribution]
    public static DocumentTypeConfiguration TypeSpecDocumentType => new("typespec")
    {
        FileExtensions = [".tsp", ".cadl"],
        BaseDocumentType = LanguageServerBaseDocumentType,
    };

    public override LanguageServerProviderConfiguration LanguageServerProviderConfiguration => new(
        "%TypeSpec.LanguageServer.DisplayName%",
        [DocumentFilter.FromDocumentType(TypeSpecDocumentType)]);

    public override async Task<IDuplexPipe?> CreateServerConnectionAsync(CancellationToken cancellationToken)
    {
        StopServer();
        ProcessStartInfo? info = null;
        try
        {
            var workspaceFolder = await GetWorkspaceFolderAsync(cancellationToken);
            info = ServerConfiguration.CreateStartInfo(
                workspaceFolder,
                Environment.GetEnvironmentVariable("TYPESPEC_SERVER_NODE_OPTIONS"),
                GetDevelopmentServerPath());
            cancellationToken.ThrowIfCancellationRequested();

            _process = Process.Start(info)
                ?? throw new InvalidOperationException("Failed to start the TypeSpec language server.");
            _process.ErrorDataReceived += (_, e) =>
            {
                if (!string.IsNullOrEmpty(e.Data))
                {
                    _traceSource.TraceEvent(TraceEventType.Information, 0, $"tsp-server: {e.Data}");
                }
            };
            _process.BeginErrorReadLine();

            return new DuplexPipe(
                PipeReader.Create(_process.StandardOutput.BaseStream),
                PipeWriter.Create(_process.StandardInput.BaseStream));
        }
        catch (Win32Exception e) when (e.NativeErrorCode == Win32ErrorCodes.ERROR_FILE_NOT_FOUND)
        {
            var error = new TypeSpecServerNotFoundException(info?.FileName ?? "tsp-server.cmd", e);
            await ReportErrorAsync(error, cancellationToken);
            throw error;
        }
        catch (TypeSpecUserErrorException e)
        {
            await ReportErrorAsync(e, cancellationToken);
            throw;
        }
    }

    public override async Task OnServerInitializationResultAsync(
        ServerInitializationResult serverInitializationResult,
        LanguageServerInitializationFailureInfo? initializationFailureInfo,
        CancellationToken cancellationToken)
    {
        if (serverInitializationResult == ServerInitializationResult.Failed)
        {
            StopServer();
            await ReportErrorAsync(
                initializationFailureInfo?.Exception
                    ?? new TypeSpecUserErrorException(initializationFailureInfo?.StatusMessage
                        ?? "Language server initialization failed."),
                cancellationToken);
        }

        await base.OnServerInitializationResultAsync(
            serverInitializationResult, initializationFailureInfo, cancellationToken);
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            StopServer();
        }
        base.Dispose(disposing);
    }

    private async Task<string?> GetWorkspaceFolderAsync(CancellationToken cancellationToken)
    {
        var solutionService = await _serviceBroker.GetProxyAsync<ISolutionService>(
            VisualStudioServices.VS2019_9.SolutionService, cancellationToken: cancellationToken)
            ?? throw new TypeSpecUserErrorException("Cannot determine the current solution or folder because Visual Studio's solution service is unavailable.");
        using (solutionService as IDisposable)
        {
            var state = await solutionService.GetOpenCodeContainersStateAsync(cancellationToken);
            return state.OpenFolderPaths.FirstOrDefault()?.LocalPath
                ?? (state.SolutionFilePath == null ? null : Path.GetDirectoryName(state.SolutionFilePath.LocalPath));
        }
    }

    private async Task ReportErrorAsync(Exception error, CancellationToken cancellationToken)
    {
        _traceSource.TraceEvent(TraceEventType.Error, 0, error.ToString());
        await Extensibility.Shell().ShowPromptAsync(
            $"Failed to activate TypeSpec language server!\n\n{error.Message}",
            PromptOptions.OK, cancellationToken);
    }

    private void StopServer()
    {
        var process = Interlocked.Exchange(ref _process, null);
        if (process == null)
        {
            return;
        }
        using (process)
        {
            try
            {
                if (!process.HasExited)
                {
                    process.Kill(entireProcessTree: true);
                }
            }
            catch (InvalidOperationException) when (process.HasExited)
            {
                _traceSource.TraceEvent(TraceEventType.Verbose, 0, "The TypeSpec language server has already exited.");
            }
        }
    }

    private static string? GetDevelopmentServerPath()
    {
#if DEBUG
        if (string.Equals(Environment.GetEnvironmentVariable("TYPESPEC_DEVELOPMENT_MODE"), "true", StringComparison.OrdinalIgnoreCase))
        {
            var directory = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location)!;
            var sourceDirectory = File.ReadAllText(Path.Combine(directory, "DebugSourceDirectory.txt")).Trim();
            return Path.GetFullPath(Path.Combine(sourceDirectory, "..", "..", "compiler", "entrypoints", "server.js"));
        }
#endif
        return null;
    }
}
#pragma warning restore VSEXTPREVIEW_LSP
