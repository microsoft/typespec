// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;

namespace Microsoft.TypeSpec.Generator.EmitterRpc
{
    public sealed class Emitter : IDisposable
    {
        private const string BasicNotificationFormat = @"{{""method"":{0},""params"":{1}}}";
        private const string Trace = "trace";
        private const string Diagnostic = "diagnostic";
        private const string InfoLevel = "info";
        private const string DebugLevel = "debug";
        private const string VerboseLevel = "verbose";

        private bool _disposed;

        private readonly StreamWriter _writer;

        private readonly object _bufferLock = new();
        private readonly Dictionary<string, Dictionary<BackCompatibilityChangeCategory, SortedSet<string>>> _bufferedMessages =
            new(StringComparer.Ordinal);

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
                level = InfoLevel,
                message = message,
            });
        }

        public void Debug(string message)
        {
            SendNotification(Trace, new
            {
                level = DebugLevel,
                message = message,
            });
        }

        public void Verbose(string message)
        {
            SendNotification(Trace, new
            {
                level = VerboseLevel,
                message = message,
            });
        }

        /// <summary>
        /// Buffers an info-level message under the given <paramref name="category"/>.
        /// Buffered messages are deduplicated per category and emitted as a single
        /// grouped summary trace when <see cref="WriteBufferedMessages"/> is called or
        /// when the emitter is disposed.
        /// </summary>
        public void Info(string message, BackCompatibilityChangeCategory category) => Buffer(InfoLevel, category, message);

        /// <summary>
        /// Buffers a debug-level message under the given <paramref name="category"/>.
        /// Buffered messages are deduplicated per category and emitted as a single
        /// grouped summary trace when <see cref="WriteBufferedMessages"/> is called or
        /// when the emitter is disposed.
        /// </summary>
        public void Debug(string message, BackCompatibilityChangeCategory category) => Buffer(DebugLevel, category, message);

        /// <summary>
        /// Buffers a verbose-level message under the given <paramref name="category"/>.
        /// Buffered messages are deduplicated per category and emitted as a single
        /// grouped summary trace when <see cref="WriteBufferedMessages"/> is called or
        /// when the emitter is disposed.
        /// </summary>
        public void Verbose(string message, BackCompatibilityChangeCategory category) => Buffer(VerboseLevel, category, message);

        private void Buffer(string level, BackCompatibilityChangeCategory category, string message)
        {
            if (string.IsNullOrEmpty(message))
            {
                return;
            }

            lock (_bufferLock)
            {
                if (!_bufferedMessages.TryGetValue(level, out var perCategory))
                {
                    perCategory = new Dictionary<BackCompatibilityChangeCategory, SortedSet<string>>();
                    _bufferedMessages[level] = perCategory;
                }

                if (!perCategory.TryGetValue(category, out var set))
                {
                    set = new SortedSet<string>(StringComparer.Ordinal);
                    perCategory[category] = set;
                }

                set.Add(message);
            }
        }

        /// <summary>
        /// Writes any buffered, category-grouped log messages as a single trace
        /// notification per level. Subsequent calls have no effect until new
        /// messages are buffered.
        /// </summary>
        public void WriteBufferedMessages()
        {
            lock (_bufferLock)
            {
                if (_bufferedMessages.Count == 0)
                {
                    return;
                }

                foreach (var levelPair in _bufferedMessages)
                {
                    int total = 0;
                    foreach (var set in levelPair.Value.Values)
                    {
                        total += set.Count;
                    }

                    int categoryCount = levelPair.Value.Count;
                    var sb = new StringBuilder();
                    sb.Append("Summary of grouped '").Append(levelPair.Key).Append("' messages: ")
                      .Append(total).Append(total == 1 ? " message across " : " messages across ")
                      .Append(categoryCount).AppendLine(categoryCount == 1 ? " category." : " categories.");

                    var orderedCategories = levelPair.Value
                        .Select(kvp => (Display: GetCategoryDisplayName(kvp.Key), Messages: kvp.Value))
                        .OrderBy(x => x.Display, StringComparer.Ordinal);
                    foreach (var (display, messages) in orderedCategories)
                    {
                        sb.Append("  ").Append(display).Append(" (").Append(messages.Count).AppendLine("):");
                        foreach (var msg in messages)
                        {
                            sb.Append("    - ").AppendLine(msg);
                        }
                    }

                    SendNotification(Trace, new
                    {
                        level = levelPair.Key,
                        message = sb.ToString().TrimEnd(),
                    });
                }

                _bufferedMessages.Clear();
            }
        }

        private static string GetCategoryDisplayName(BackCompatibilityChangeCategory category) => category switch
        {
            BackCompatibilityChangeCategory.MethodParameterReordering => "Method Parameter Reordering",
            BackCompatibilityChangeCategory.ParameterNamePreserved => "Parameter Name Preserved",
            BackCompatibilityChangeCategory.AdditionalPropertiesShapePreserved => "AdditionalProperties Shape Preserved",
            BackCompatibilityChangeCategory.CollectionPropertyTypePreserved => "Collection Property Type Preserved",
            BackCompatibilityChangeCategory.ConstructorModifierPreserved => "Constructor Modifier Preserved",
            BackCompatibilityChangeCategory.EnumMemberReordering => "Enum Member Reordering",
            BackCompatibilityChangeCategory.ApiVersionEnumMemberAdded => "Api Version Enum Member Added From Last Contract",
            BackCompatibilityChangeCategory.ModelFactoryMethodReplaced => "Model Factory Method Replaced For Back-Compat",
            BackCompatibilityChangeCategory.ModelFactoryMethodAdded => "Model Factory Method Added For Back-Compat",
            BackCompatibilityChangeCategory.ModelFactoryMethodSkipped => "Model Factory Method Back-Compat Skipped",
            _ => category.ToString(),
        };

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
                    WriteBufferedMessages();
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
