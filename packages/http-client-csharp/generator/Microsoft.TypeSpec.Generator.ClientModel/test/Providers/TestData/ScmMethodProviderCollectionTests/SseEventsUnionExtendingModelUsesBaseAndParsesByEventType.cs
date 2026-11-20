public virtual async global::System.Threading.Tasks.Task<global::System.ClientModel.AsyncStreamingResult<global::System.Net.ServerSentEvents.SseItem<global::Sample.Models.ResponseEvent>>> ReceiveAsync(global::System.Threading.CancellationToken cancellationToken = default)
{
    using global::System.ClientModel.Primitives.PipelineMessage message = this.CreateReceiveRequest(cancellationToken.ToRequestOptions());
    message.BufferResponse = false;
    return global::System.ClientModel.AsyncStreamingResult.CreateSse<global::Sample.Models.ResponseEvent>(await Pipeline.ProcessMessageAsync(message, cancellationToken.ToRequestOptions()).ConfigureAwait(false), (eventType, data) => eventType switch
    {
        "response.created" => global::System.ClientModel.Primitives.ModelReaderWriter.Read<global::Sample.Models.ResponseCreated>(global::System.BinaryData.FromBytes(data.ToArray()), _modelReaderWriterOptions, global::Sample.SampleContext.Default),
        "message" => global::System.ClientModel.Primitives.ModelReaderWriter.Read<global::Sample.Models.ResponseDelta>(global::System.BinaryData.FromBytes(data.ToArray()), _modelReaderWriterOptions, global::Sample.SampleContext.Default),
        _ => global::System.ClientModel.Primitives.ModelReaderWriter.Read<global::Sample.Models.ResponseEvent>(global::System.BinaryData.FromBytes(data.ToArray()), _modelReaderWriterOptions, global::Sample.SampleContext.Default)
    }, null, cancellationToken);
}
