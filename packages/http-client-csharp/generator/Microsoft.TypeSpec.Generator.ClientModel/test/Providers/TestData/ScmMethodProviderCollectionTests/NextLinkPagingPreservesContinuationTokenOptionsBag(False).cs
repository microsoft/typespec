public virtual global::System.ClientModel.Primitives.CollectionResult GetItems(global::Sample.Models.GetItemsOptions options, string token, global::System.ClientModel.Primitives.RequestOptions requestOptions)
{
    global::Sample.Argument.AssertNotNull(options, nameof(options));

    return new global::Sample.TestClient.GetItemsCollectionResult(this, token, options.Filter, requestOptions);
}
public virtual global::System.ClientModel.Primitives.AsyncCollectionResult GetItemsAsync(global::Sample.Models.GetItemsOptions options, string token, global::System.ClientModel.Primitives.RequestOptions requestOptions)
{
    global::Sample.Argument.AssertNotNull(options, nameof(options));

    return new global::Sample.TestClient.GetItemsAsyncCollectionResult(this, token, options.Filter, requestOptions);
}
public virtual global::System.ClientModel.CollectionResult<global::Sample.Models.Item> GetItems(global::Sample.Models.GetItemsOptions options, string token = default, global::System.Threading.CancellationToken cancellationToken = default)
{
    global::Sample.Argument.AssertNotNull(options, nameof(options));

    return new global::Sample.TestClient.GetItemsCollectionResultOfT(this, token, options.Filter, cancellationToken.ToRequestOptions());
}
public virtual global::System.ClientModel.AsyncCollectionResult<global::Sample.Models.Item> GetItemsAsync(global::Sample.Models.GetItemsOptions options, string token = default, global::System.Threading.CancellationToken cancellationToken = default)
{
    global::Sample.Argument.AssertNotNull(options, nameof(options));

    return new global::Sample.TestClient.GetItemsAsyncCollectionResultOfT(this, token, options.Filter, cancellationToken.ToRequestOptions());
}
