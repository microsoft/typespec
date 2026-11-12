public partial global::System.ClientModel.Primitives.CollectionResult GetItems(global::Sample.Models.GetItemsOptions options, global::System.ClientModel.Primitives.RequestOptions requestOptions)
{
    global::Sample.Argument.AssertNotNull(options, nameof(options));

    return new global::Sample.TestClientGetItemsCollectionResult(this, options.Token, options.Filter, requestOptions);
}
public partial global::System.ClientModel.Primitives.AsyncCollectionResult GetItemsAsync(global::Sample.Models.GetItemsOptions options, global::System.ClientModel.Primitives.RequestOptions requestOptions)
{
    global::Sample.Argument.AssertNotNull(options, nameof(options));

    return new global::Sample.TestClientGetItemsAsyncCollectionResult(this, options.Token, options.Filter, requestOptions);
}
public partial global::System.ClientModel.CollectionResult<global::Sample.Models.Item> GetItems(global::Sample.Models.GetItemsOptions options, global::System.Threading.CancellationToken cancellationToken)
{
    global::Sample.Argument.AssertNotNull(options, nameof(options));

    return new global::Sample.TestClientGetItemsCollectionResultOfT(this, options.Token, options.Filter, cancellationToken.ToRequestOptions());
}
public partial global::System.ClientModel.AsyncCollectionResult<global::Sample.Models.Item> GetItemsAsync(global::Sample.Models.GetItemsOptions options, global::System.Threading.CancellationToken cancellationToken)
{
    global::Sample.Argument.AssertNotNull(options, nameof(options));

    return new global::Sample.TestClientGetItemsAsyncCollectionResultOfT(this, options.Token, options.Filter, cancellationToken.ToRequestOptions());
}
