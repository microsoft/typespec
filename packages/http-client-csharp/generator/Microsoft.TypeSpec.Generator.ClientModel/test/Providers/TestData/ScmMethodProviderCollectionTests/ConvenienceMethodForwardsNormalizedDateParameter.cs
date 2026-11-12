public virtual async global::System.Threading.Tasks.Task<global::System.ClientModel.ClientResult> GetThingAsync(global::System.DateTimeOffset requestOn, global::System.Threading.CancellationToken cancellationToken = default)
{
    return await this.GetThingAsync(requestOn, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
}
