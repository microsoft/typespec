// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System.Reflection;
using System.Text.Json;
using BenchmarkDotNet.Attributes;

namespace Microsoft.Generator.CSharp.Input.Tests.Perf
{
    public class EnumSerialization
    {
        private static readonly string _path = Path.Combine(Directory.GetParent(Assembly.GetExecutingAssembly().Location)!.FullName, "TestData", "StringEnum", "tspCodeModel.json");
        private static readonly byte[] _bytes = File.ReadAllBytes(_path);
        private TypeSpecReferenceHandler? _resolver;
        private JsonSerializerOptions? _options;

        [IterationSetup]
        public void Setup()
        {
            _resolver = new TypeSpecReferenceHandler();
            _options = new JsonSerializerOptions();
            _options.Converters.Add(new TypeSpecInputEnumTypeConverter(_resolver));
            _options.Converters.Add(new TypeSpecInputEnumTypeValueConverter(_resolver));
        }

        [Benchmark]
        public void EnumDeserialization()
        {
            var reader = new Utf8JsonReader(_bytes);
            reader.Read(); // {
            reader.Read(); //   "Enums"
            reader.Read(); //   [
            reader.Read(); //     {
            while (reader.TokenType != JsonTokenType.EndArray)
            {
                if (reader.TokenType == JsonTokenType.StartObject)
                {
                    reader.Read();
                    continue;
                }

                _ = TypeSpecInputEnumTypeConverter.CreateEnumType(ref reader, null, null, _options!, _resolver!.CurrentResolver);

                if (reader.TokenType == JsonTokenType.EndObject)
                {
                    reader.Read();
                }
            }
        }
    }
}
