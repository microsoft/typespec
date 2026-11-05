public virtual async global::System.Threading.Tasks.Task<global::System.ClientModel.ClientResult<global::System.BinaryData>> GetWidgetAsync(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = await this.GetWidgetAsync(cancellationToken.ToRequestOptions()).ConfigureAwait(false);
    return global::System.ClientModel.ClientResult.FromValue(result.GetRawResponse().Content, result.GetRawResponse());
}
