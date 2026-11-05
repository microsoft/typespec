public virtual async global::System.Threading.Tasks.Task<global::System.ClientModel.ClientResult> GetWidgetAsync(global::System.Threading.CancellationToken cancellationToken = default)
{
    return await this.GetWidgetAsync(cancellationToken.ToRequestOptions()).ConfigureAwait(false);
}
