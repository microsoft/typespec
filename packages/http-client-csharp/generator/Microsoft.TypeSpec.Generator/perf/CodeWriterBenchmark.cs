// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using BenchmarkDotNet.Attributes;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Perf
{
    public class CodeWriterBenchmark
    {
        private TypeProviderWriter _writer;

        public CodeWriterBenchmark()
        {
            GeneratorInitializer.Initialize();
            var properties = new[]
            {
                new InputModelProperty("MyProperty", null, "The property of mine", InputPrimitiveType.Int32, true, false, false, new(json: new("myProperty")))
            };
            var inputModel = new InputModelType("MyModel", "MyNamespace", string.Empty, null, null, null, "Test model", InputModelTypeUsage.Input | InputModelTypeUsage.Output, properties, null, Array.Empty<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false, new());
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
