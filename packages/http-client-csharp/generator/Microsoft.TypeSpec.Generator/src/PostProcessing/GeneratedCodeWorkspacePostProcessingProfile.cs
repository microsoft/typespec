// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;

namespace Microsoft.TypeSpec.Generator
{
    internal sealed class GeneratedCodeWorkspacePostProcessingProfile
    {
        private readonly object _syncRoot = new();
        private readonly Dictionary<string, StepSummary> _steps = new(StringComparer.Ordinal);

        public void Add(string stepName, TimeSpan elapsed, long allocatedBytes)
        {
            lock (_syncRoot)
            {
                ref var summary = ref CollectionsMarshal.GetValueRefOrAddDefault(_steps, stepName, out _);
                summary.Count++;
                summary.ElapsedTicks += elapsed.Ticks;
                summary.AllocatedBytes += allocatedBytes;
            }
        }

        public string GetSummary()
        {
            KeyValuePair<string, StepSummary>[] steps;
            lock (_syncRoot)
            {
                steps = _steps.ToArray();
            }

            var totalTicks = steps
                .Where(static step => step.Key != "ProcessDocument.Total")
                .Sum(static step => step.Value.ElapsedTicks);
            var builder = new StringBuilder();
            builder.AppendLine("Post-processing step profile:");
            builder.AppendLine("Step, Count, Total ms, Avg ms, Percent of measured steps, Allocated bytes, Avg allocated bytes");

            foreach (var step in steps.OrderByDescending(static step => step.Value.ElapsedTicks))
            {
                var elapsedMs = TimeSpan.FromTicks(step.Value.ElapsedTicks).TotalMilliseconds;
                var averageMs = elapsedMs / step.Value.Count;
                var averageAllocatedBytes = step.Value.AllocatedBytes / step.Value.Count;
                var percentage = totalTicks == 0 || step.Key == "ProcessDocument.Total"
                    ? 0
                    : step.Value.ElapsedTicks * 100.0 / totalTicks;
                builder.AppendLine($"{step.Key}, {step.Value.Count}, {elapsedMs:F3}, {averageMs:F3}, {percentage:F1}%, {step.Value.AllocatedBytes}, {averageAllocatedBytes}");
            }

            return builder.ToString();
        }

        private struct StepSummary
        {
            public int Count;
            public long ElapsedTicks;
            public long AllocatedBytes;
        }
    }
}
