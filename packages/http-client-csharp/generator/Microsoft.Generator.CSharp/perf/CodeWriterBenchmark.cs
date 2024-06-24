// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using BenchmarkDotNet.Attributes;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Perf
{
    public class CodeWriterBenchmark
    {
        private TypeProviderWriter _writer;

        public CodeWriterBenchmark()
        {
            var properties = new[]
            {
                new InputModelProperty("MyProperty", "myProperty", "The property of mine", new InputPrimitiveType(InputPrimitiveTypeKind.Int32, false), true, false, false)
            };
            var inputModel = new InputModelType("MyModel", null, null, null, "Test model", InputModelTypeUsage.RoundTrip, properties, null, Array.Empty<InputModelType>(), null, null, null, false, false);
            var modelProvider = new ModelProvider(inputModel);
            _writer = new TypeProviderWriter(modelProvider);
        }

        [GlobalSetup]
        public void GlobalSetup()
        {
            PluginInitializer.Initialize();
        }

        [Benchmark]
        public void WriteModel()
        {
            _writer.Write();
        }
    }
}
