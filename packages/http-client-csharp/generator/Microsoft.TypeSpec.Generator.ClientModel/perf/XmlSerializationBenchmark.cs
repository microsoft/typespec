// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Xml;
using System.Xml.Linq;
using BenchmarkDotNet.Attributes;
using Payload.Xml;

namespace Microsoft.TypeSpec.Generator.ClientModel.Perf;

/// <summary>
/// Benchmarks comparing streaming vs DOM-based XML serialization approaches
/// for nested model serialization using generated Payload.Xml models.
/// </summary>
[MemoryDiagnoser]
public class XmlSerializationBenchmark
{
    private static readonly ModelReaderWriterOptions WireOptions = new("W");

    private ModelWithArrayOfModel _smallModel = null!;
    private ModelWithArrayOfModel _mediumModel = null!;
    private ModelWithArrayOfModel _largeModel = null!;

    [GlobalSetup]
    public void Setup()
    {
        _smallModel = CreateModel(10);
        _mediumModel = CreateModel(100);
        _largeModel = CreateModel(1000);
    }

    private static ModelWithArrayOfModel CreateModel(int itemCount)
    {
        var items = new List<SimpleModel>(itemCount);
        for (int i = 0; i < itemCount; i++)
        {
            items.Add(new SimpleModel($"Name{i}", i));
        }
        return new ModelWithArrayOfModel(items);
    }

    // ========== Small Model (10 items) ==========

    [Benchmark(Description = "Small (10) - DOM")]
    public void SmallModel_DomApproach()
    {
        SerializeWithDomApproach(_smallModel);
    }

    [Benchmark(Description = "Small (10) - Streaming")]
    public void SmallModel_StreamingApproach()
    {
        SerializeWithStreamingApproach(_smallModel);
    }

    // ========== Medium Model (100 items) ==========

    [Benchmark(Description = "Medium (100) - DOM")]
    public void MediumModel_DomApproach()
    {
        SerializeWithDomApproach(_mediumModel);
    }

    [Benchmark(Description = "Medium (100) - Streaming")]
    public void MediumModel_StreamingApproach()
    {
        SerializeWithStreamingApproach(_mediumModel);
    }

    // ========== Large Model (1000 items) ==========

    [Benchmark(Description = "Large (1000) - DOM")]
    public void LargeModel_DomApproach()
    {
        SerializeWithDomApproach(_largeModel);
    }

    [Benchmark(Description = "Large (1000) - Streaming")]
    public void LargeModel_StreamingApproach()
    {
        SerializeWithStreamingApproach(_largeModel);
    }

    /// <summary>
    /// Previous approach: Load into XElement DOM, then write to target.
    /// Simulates the old WriteObjectValue implementation.
    /// </summary>
    private static void SerializeWithDomApproach(ModelWithArrayOfModel model)
    {
        using var outputStream = new MemoryStream();
        using var writer = XmlWriter.Create(outputStream);

        writer.WriteStartElement("Root");
        writer.WriteStartElement("items");

        foreach (var item in model.Items)
        {
            // Serialize the model to BinaryData (as IPersistableModel does)
            BinaryData data = ModelReaderWriter.Write(item, WireOptions);
            using Stream stream = data.ToStream();

            // DOM approach: parse into XElement, then write
            XElement element = XElement.Load(stream, LoadOptions.None);
            element.WriteTo(writer);
        }

        writer.WriteEndElement(); // items
        writer.WriteEndElement(); // Root
        writer.Flush();
    }

    /// <summary>
    /// New approach: Uses the actual generated WriteObjectValue extension method
    /// which streams directly using XmlReader + WriteNode.
    /// </summary>
    private static void SerializeWithStreamingApproach(ModelWithArrayOfModel model)
    {
        using var outputStream = new MemoryStream();
        using var writer = XmlWriter.Create(outputStream);

        writer.WriteStartElement("Root");
        writer.WriteStartElement("items");

        foreach (var item in model.Items)
        {
            // Use the actual generated extension method
            writer.WriteStartElement("SimpleModel");
            writer.WriteObjectValue(item, WireOptions);
            writer.WriteEndElement();
        }

        writer.WriteEndElement(); // items
        writer.WriteEndElement(); // Root
        writer.Flush();
    }
}
