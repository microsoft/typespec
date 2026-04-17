// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.TypeSpec.Generator.Utilities
{
    /// <summary>
    /// Collects human-readable descriptions of back-compatibility changes made during
    /// code generation (replacements / updates due to a library's last contract) so that
    /// a single debug-level summary can be emitted at the end of the run.
    ///
    /// This makes it much easier to debug why a given type, method, parameter, property,
    /// or enum member differs from what the current TypeSpec alone would produce.
    /// </summary>
    public static class BackCompatibilityLogger
    {
        private static readonly object _lock = new();
        private static readonly SortedDictionary<string, SortedSet<string>> _changes =
            new(StringComparer.Ordinal);

        /// <summary>
        /// Records a back-compatibility change. Duplicate entries for the same
        /// <paramref name="category"/> and <paramref name="message"/> are collapsed.
        /// </summary>
        /// <param name="category">High-level grouping for the change.</param>
        /// <param name="message">Specific human-readable description of the change.</param>
        public static void LogChange(BackCompatibilityChangeCategory category, string message)
        {
            if (string.IsNullOrEmpty(message))
            {
                return;
            }

            string categoryName = GetCategoryDisplayName(category);
            lock (_lock)
            {
                if (!_changes.TryGetValue(categoryName, out var set))
                {
                    set = new SortedSet<string>(StringComparer.Ordinal);
                    _changes[categoryName] = set;
                }
                set.Add(message);
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

        /// <summary>
        /// Indicates whether any back-compatibility change has been recorded.
        /// </summary>
        public static bool HasChanges
        {
            get
            {
                lock (_lock)
                {
                    return _changes.Count > 0;
                }
            }
        }

        /// <summary>
        /// Builds a human-readable summary of all recorded back-compatibility changes.
        /// Returns <see langword="null"/> if no changes have been recorded.
        /// </summary>
        public static string? BuildSummary()
        {
            lock (_lock)
            {
                if (_changes.Count == 0)
                {
                    return null;
                }

                var sb = new StringBuilder();
                int total = 0;
                foreach (var kvp in _changes)
                {
                    total += kvp.Value.Count;
                }

                sb.Append("Back-compatibility changes summary (applied due to last contract): ")
                  .Append(total)
                  .Append(" change(s) across ")
                  .Append(_changes.Count)
                  .AppendLine(" categor(y/ies).");

                foreach (var kvp in _changes)
                {
                    sb.Append("  ").Append(kvp.Key).Append(" (").Append(kvp.Value.Count).AppendLine("):");
                    foreach (var change in kvp.Value)
                    {
                        sb.Append("    - ").AppendLine(change);
                    }
                }

                return sb.ToString().TrimEnd();
            }
        }

        /// <summary>
        /// Emits the accumulated back-compatibility changes summary as a single debug
        /// trace message and clears the internal state. Does nothing when no changes
        /// have been recorded.
        /// </summary>
        public static void EmitSummary()
        {
            string? summary = BuildSummary();
            if (summary == null)
            {
                return;
            }

            CodeModelGenerator.Instance.Emitter.Debug(summary);
            Reset();
        }

        /// <summary>
        /// Clears all recorded back-compatibility changes. Exposed primarily for tests.
        /// </summary>
        public static void Reset()
        {
            lock (_lock)
            {
                _changes.Clear();
            }
        }
    }
}
