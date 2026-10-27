public partial async global::System.Threading.Tasks.Task<global::System.ClientModel.ClientResult> HelloAgainAsync(global::System.ClientModel.BinaryContent content, global::System.ClientModel.Primitives.RequestOptions options)
{
    using global::System.ClientModel.Primitives.PipelineMessage message = this.CreateHelloAgainRequest(content, options);
    return global::System.ClientModel.ClientResult.FromResponse(await Pipeline.ProcessMessageAsync(message, options).ConfigureAwait(false));
}
