public virtual global::System.ClientModel.Primitives.CollectionResult GetItems(string token, string filter, global::System.ClientModel.Primitives.RequestOptions options)
{
    return new global::Sample.TestClientGetItemsCollectionResult(this, _modelReaderWriterOptions, token, filter, options);
}
public virtual global::System.ClientModel.Primitives.AsyncCollectionResult GetItemsAsync(string token, string filter, global::System.ClientModel.Primitives.RequestOptions options)
{
    return new global::Sample.TestClientGetItemsAsyncCollectionResult(this, _modelReaderWriterOptions, token, filter, options);
}
public virtual global::System.ClientModel.CollectionResult<global::Sample.Models.Item> GetItems(string token = default, string filter = default, global::System.Threading.CancellationToken cancellationToken = default)
{
    return new global::Sample.TestClientGetItemsCollectionResultOfT(this, _modelReaderWriterOptions, token, filter, cancellationToken.ToRequestOptions());
}
public virtual global::System.ClientModel.AsyncCollectionResult<global::Sample.Models.Item> GetItemsAsync(string token = default, string filter = default, global::System.Threading.CancellationToken cancellationToken = default)
{
    return new global::Sample.TestClientGetItemsAsyncCollectionResultOfT(this, _modelReaderWriterOptions, token, filter, cancellationToken.ToRequestOptions());
}
