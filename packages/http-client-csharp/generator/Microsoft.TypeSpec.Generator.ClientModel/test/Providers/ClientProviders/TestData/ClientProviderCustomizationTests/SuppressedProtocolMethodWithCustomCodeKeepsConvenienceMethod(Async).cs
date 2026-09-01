public virtual async global::System.Threading.Tasks.Task<global::System.ClientModel.ClientResult> HelloAgainAsync(global::System.Threading.CancellationToken cancellationToken = default)
{
    return await this.HelloAgainAsync(cancellationToken.ToRequestOptions()).ConfigureAwait(false);
}
