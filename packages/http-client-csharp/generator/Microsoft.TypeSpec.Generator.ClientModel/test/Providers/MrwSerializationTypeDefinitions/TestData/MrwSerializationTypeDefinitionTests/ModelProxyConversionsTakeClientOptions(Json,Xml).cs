internal global::System.ClientModel.BinaryContent ToBinaryContent(global::System.ClientModel.Primitives.ModelReaderWriterOptions options)
{
    return global::System.ClientModel.BinaryContent.Create(this, options);
}
internal static global::Sample.Models.TestModel FromClientResult(global::System.ClientModel.ClientResult result, global::System.ClientModel.Primitives.ModelReaderWriterOptions options)
{
    global::System.ClientModel.Primitives.PipelineResponse response = result.GetRawResponse();

    if ((response.Headers.TryGetValue("Content-Type", out string value) && value.StartsWith("application/json", global::System.StringComparison.OrdinalIgnoreCase)))
    {
        if (options.ShouldReadThroughProxy<global::Sample.Models.TestModel>(global::Sample.SampleContext.Default))
        {
            return global::System.ClientModel.Primitives.ModelReaderWriter.Read<global::Sample.Models.TestModel>(response.Content, options, global::Sample.SampleContext.Default);
        }
        using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(response.Content, global::Sample.ModelSerializationExtensions.JsonDocumentOptions);
        return global::Sample.Models.TestModel.DeserializeTestModel(document.RootElement, options);
    }

    if (options.ShouldReadThroughProxy<global::Sample.Models.TestModel>(global::Sample.SampleContext.Default))
    {
        return global::System.ClientModel.Primitives.ModelReaderWriter.Read<global::Sample.Models.TestModel>(response.Content, options.ToXmlOptions(), global::Sample.SampleContext.Default);
    }
    using global::System.IO.Stream stream = response.ContentStream;
    if ((stream == null))
    {
        return default;
    }

    return global::Sample.Models.TestModel.DeserializeTestModel(global::System.Xml.Linq.XElement.Load(stream, global::System.Xml.Linq.LoadOptions.PreserveWhitespace), options);
}
