// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using BenchmarkDotNet.Attributes;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Perf
{
    public class CodeWriterBenchmark
    {
        private TypeProviderWriter _writer;

        public CodeWriterBenchmark()
        {
            PluginInitializer.Initialize();
            var properties = new[]
            {
                new InputModelProperty("MyProperty", "myProperty", "The property of mine", InputPrimitiveType.Int32, true, false, false)
            };
            var inputModel = new InputModelType("MyModel", string.Empty, null, null, "Test model", InputModelTypeUsage.Input | InputModelTypeUsage.Output, properties, null, Array.Empty<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            var modelProvider = new ModelProvider(inputModel);
            _writer = new TypeProviderWriter(modelProvider);
        }

        [Benchmark]
        public void WriteModel()
        {
            _writer.Write();
        }
    }
}
