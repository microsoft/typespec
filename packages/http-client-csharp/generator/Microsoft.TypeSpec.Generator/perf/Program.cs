// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using BenchmarkDotNet.Configs;
using BenchmarkDotNet.Diagnosers;
using BenchmarkDotNet.Jobs;
using BenchmarkDotNet.Running;
using Perfolizer.Horology;

namespace Microsoft.TypeSpec.Generator.Perf;

public class Program
{
    public static void Main(string[] args)
    {
        // List workloads: dotnet run -c Release -- --list flat
        // Run a class: dotnet run -c Release -- --filter '*FullGenerationBenchmark*'
        // Smoke test: dotnet run -c Release -- --filter '*PostProcessingBenchmark*' --job Dry
        // See README.md for workload boundaries and optional step profiling.

        var config = ManualConfig.Create(DefaultConfig.Instance);
        config.Options = ConfigOptions.JoinSummary | ConfigOptions.StopOnFirstError;
        config = config.AddDiagnoser(MemoryDiagnoser.Default);
        // In this BDN version a custom default job overrides --job Dry/Short.
        // Let explicitly selected CLI jobs use their own iteration settings.
        if (!args.Any(static arg => arg is "--job" or "-j" || arg.StartsWith("--job=", StringComparison.Ordinal)))
        {
            config.AddJob(Job.Default
                .WithWarmupCount(1)
                .WithIterationTime(TimeInterval.FromMilliseconds(250))
                .WithMinIterationCount(15)
                .WithMaxIterationCount(20)
                .AsDefault());
        }
        BenchmarkSwitcher.FromAssembly(typeof(Program).Assembly).Run(args, config);
    }
}
