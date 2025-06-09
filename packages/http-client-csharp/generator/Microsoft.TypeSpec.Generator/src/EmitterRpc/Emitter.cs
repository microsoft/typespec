// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Text.Json;

namespace Microsoft.TypeSpec.Generator.EmitterRpc
{
    public sealed class Emitter : IDisposable
    {
        private const string BasicNotificationFormat = @"{{""method"":{0},""params"":{1}}}";
        private const string Trace = "trace";
        private const string Diagnostic = "diagnostic";

        private bool _disposed;

        private readonly StreamWriter _writer;

        internal Emitter(Stream stream)
        {
            _writer = new StreamWriter(stream) { AutoFlush = true };
        }

        private void SendNotification(string method, object content)
        {
            var paramsContent = JsonSerializer.Serialize(content);
            var message = string.Format(BasicNotificationFormat, AsStringLiteral(method), paramsContent);
            _writer.WriteLine(message);
        }

        private static string AsStringLiteral(string input) => $"\"{input}\"";

        public void Info(string message)
        {
            SendNotification(Trace, new
            {
                level = "info",
                message = message,
            });
        }

        public void Debug(string message)
        {
            SendNotification(Trace, new
            {
                level = "debug",
                message = message,
            });
        }

        public void Verbose(string message)
        {
            SendNotification(Trace, new
            {
                level = "verbose",
                message = message,
            });
        }

        public void ReportDiagnostic(string code, string message, string? targetCrossLanguageDefinitionId = null, EmitterDiagnosticSeverity severity = EmitterDiagnosticSeverity.Warning)
        {
            if (targetCrossLanguageDefinitionId != null)
            {
                SendNotification(Diagnostic, new
                {
                    code = code,
                    message = message,
                    crossLanguageDefinitionId = targetCrossLanguageDefinitionId,
                    severity = GetString(severity),
                });
            }
            else
            {
                SendNotification(Diagnostic, new
                {
                    code = code,
                    message = message,
                    severity = GetString(severity),
                });
            }
        }

        private static string GetString(EmitterDiagnosticSeverity severity)
        {
            return severity switch
            {
                EmitterDiagnosticSeverity.Error => "error",
                EmitterDiagnosticSeverity.Warning => "warning",
                _ => throw new ArgumentOutOfRangeException(nameof(severity), severity, null)
            };
        }

        private void Dispose(bool disposing)
        {
            if (!_disposed)
            {
                if (disposing)
                {
                    _writer.Dispose();
                }

                _disposed = true;
            }
        }

        void IDisposable.Dispose()
        {
            // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
            Dispose(disposing: true);
            GC.SuppressFinalize(this);
        }
    }
}
