public virtual async global::System.Threading.Tasks.Task<global::System.ClientModel.AsyncStreamingResult<global::Sample.Models.Info>> ReceiveAsync(global::System.Threading.CancellationToken cancellationToken = default)
{
    using global::System.ClientModel.Primitives.PipelineMessage message = this.CreateReceiveRequest(cancellationToken.ToRequestOptions());
    message.BufferResponse = false;
    return global::System.ClientModel.AsyncStreamingResult.CreateJsonLines<global::Sample.Models.Info>(await Pipeline.ProcessMessageAsync(message, cancellationToken.ToRequestOptions()).ConfigureAwait(false), data => global::System.ClientModel.Primitives.ModelReaderWriter.Read<global::Sample.Models.Info>(data, global::Sample.ModelSerializationExtensions.WireOptions, global::Sample.SampleContext.Default), cancellationToken);
}
