public virtual global::System.ClientModel.ClientResult TestMethod(global::System.DateTimeOffset? requestDate, string ifMatch, global::System.ClientModel.Primitives.RequestOptions options)
{
    using global::System.ClientModel.Primitives.PipelineMessage message = this.CreateTestMethodRequest(requestDate, ifMatch, options);
    return global::System.ClientModel.ClientResult.FromResponse(Pipeline.ProcessMessage(message, options));
}
public virtual global::System.ClientModel.ClientResult TestMethod(global::System.DateTimeOffset? requestDate = default, string ifMatch = default, global::System.Threading.CancellationToken cancellationToken = default)
{
    return this.TestMethod(requestDate, ifMatch, cancellationToken.ToRequestOptions());
}
public virtual async global::System.Threading.Tasks.Task<global::System.ClientModel.ClientResult> TestMethodAsync(global::System.DateTimeOffset? requestDate, string ifMatch, global::System.ClientModel.Primitives.RequestOptions options)
{
    using global::System.ClientModel.Primitives.PipelineMessage message = this.CreateTestMethodRequest(requestDate, ifMatch, options);
    return global::System.ClientModel.ClientResult.FromResponse(await Pipeline.ProcessMessageAsync(message, options).ConfigureAwait(false));
}
public virtual async global::System.Threading.Tasks.Task<global::System.ClientModel.ClientResult> TestMethodAsync(global::System.DateTimeOffset? requestDate = default, string ifMatch = default, global::System.Threading.CancellationToken cancellationToken = default)
{
    return await this.TestMethodAsync(requestDate, ifMatch, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
}
