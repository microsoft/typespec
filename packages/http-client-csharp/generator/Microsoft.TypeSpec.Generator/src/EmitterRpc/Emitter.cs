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

        private static Emitter? _emitter;
        private bool _disposedValue;

        private readonly StreamWriter _writer;

        private Emitter()
        {
            _writer = new StreamWriter(Console.OpenStandardOutput()) { AutoFlush = true };
        }

        public static Emitter Instance => _emitter ??= new Emitter();

        private void SendNotification(string method, object content)
        {
            var paramsContent = JsonSerializer.Serialize(content);
            var message = string.Format(BasicNotificationFormat, AsStringLiteral(method), paramsContent);
            _writer.WriteLine(message);
        }

        private static string AsStringLiteral(string input) => $"\"{input}\"";

        public void Info(string message)
        {
            SendNotification("trace", new
            {
                level = "info",
                message = message,
            });
        }

        public void Debug(string message)
        {
            SendNotification("trace", new
            {
                level = "debug",
                message = message,
            });
        }

        public void Verbose(string message)
        {
            SendNotification("trace", new
            {
                level = "verbose",
                message = message,
            });
        }

        public void ReportDiagnostic(string code, string message, string? targetCrossLanguageDefinitionId = null)
        {
            if (targetCrossLanguageDefinitionId != null)
            {
                SendNotification("diagnostic", new
                {
                    code = code,
                    message = message,
                    crossLanguageDefinitionId = targetCrossLanguageDefinitionId
                });
            }
            else
            {
                SendNotification("diagnostic", new
                {
                    code = code,
                    message = message,
                });
            }
        }

        private void Dispose(bool disposing)
        {
            if (!_disposedValue)
            {
                if (disposing)
                {
                    _writer.Dispose();
                }

                _disposedValue = true;
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
