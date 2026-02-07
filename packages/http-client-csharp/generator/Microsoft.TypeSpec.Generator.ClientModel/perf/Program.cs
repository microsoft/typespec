// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using BenchmarkDotNet.Configs;
using BenchmarkDotNet.Diagnosers;
using BenchmarkDotNet.Jobs;
using BenchmarkDotNet.Running;
using Perfolizer.Horology;

namespace Microsoft.TypeSpec.Generator.ClientModel.Perf;

public class Program
{
    public static void Main(string[] args)
    {
        // To see the list of benchmarks that can be run
        // dotnet run -c Release --framework net10.0 --list flat

        // To run a specific benchmark class
        // dotnet run -c Release --framework net10.0 --filter *XmlSerializationBenchmark*

        // To run all benchmarks
        // dotnet run -c Release --framework net10.0

        var config = ManualConfig.Create(DefaultConfig.Instance)
            .AddDiagnoser(MemoryDiagnoser.Default)
            .AddJob(Job.Default
                .WithWarmupCount(3)
                .WithIterationCount(10)
                .WithIterationTime(TimeInterval.FromMilliseconds(250)));

        BenchmarkSwitcher.FromAssembly(typeof(Program).Assembly).Run(args, config);
    }
}
