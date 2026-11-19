public virtual global::System.ClientModel.Primitives.CollectionResult GetItems(global::Sample.Models.GetItemsOptions options, string token, global::System.ClientModel.Primitives.RequestOptions requestOptions)
{
    global::Sample.Argument.AssertNotNull(options, nameof(options));

    return new global::Sample.TestClientGetItemsCollectionResult(this, token, options.Filter, requestOptions);
}
public virtual global::System.ClientModel.Primitives.AsyncCollectionResult GetItemsAsync(global::Sample.Models.GetItemsOptions options, string token, global::System.ClientModel.Primitives.RequestOptions requestOptions)
{
    global::Sample.Argument.AssertNotNull(options, nameof(options));

    return new global::Sample.TestClientGetItemsAsyncCollectionResult(this, token, options.Filter, requestOptions);
}
public virtual global::System.ClientModel.CollectionResult<global::Sample.Models.Item> GetItems(global::Sample.Models.GetItemsOptions options, string token = default, global::System.Threading.CancellationToken cancellationToken = default)
{
    global::Sample.Argument.AssertNotNull(options, nameof(options));

    return new global::Sample.TestClientGetItemsCollectionResultOfT(this, token, options.Filter, cancellationToken.ToRequestOptions());
}
public virtual global::System.ClientModel.AsyncCollectionResult<global::Sample.Models.Item> GetItemsAsync(global::Sample.Models.GetItemsOptions options, string token = default, global::System.Threading.CancellationToken cancellationToken = default)
{
    global::Sample.Argument.AssertNotNull(options, nameof(options));

    return new global::Sample.TestClientGetItemsAsyncCollectionResultOfT(this, token, options.Filter, cancellationToken.ToRequestOptions());
}
