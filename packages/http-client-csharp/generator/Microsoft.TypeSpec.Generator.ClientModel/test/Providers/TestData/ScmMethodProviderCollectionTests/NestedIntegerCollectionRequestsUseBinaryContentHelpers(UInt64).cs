public virtual global::System.ClientModel.ClientResult SendNested(global::System.Collections.Generic.IEnumerable<global::System.Collections.Generic.IList<ulong>> body, global::System.Threading.CancellationToken cancellationToken = default)
{
    global::Sample.Argument.AssertNotNull(body, nameof(body));

    using global::System.ClientModel.BinaryContent content = global::Sample.BinaryContentHelper.FromEnumerable(body);
    return this.SendNested(content, cancellationToken.ToRequestOptions());
}
public virtual async global::System.Threading.Tasks.Task<global::System.ClientModel.ClientResult> SendNestedAsync(global::System.Collections.Generic.IEnumerable<global::System.Collections.Generic.IList<ulong>> body, global::System.Threading.CancellationToken cancellationToken = default)
{
    global::Sample.Argument.AssertNotNull(body, nameof(body));

    using global::System.ClientModel.BinaryContent content = global::Sample.BinaryContentHelper.FromEnumerable(body);
    return await this.SendNestedAsync(content, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
}
public virtual global::System.ClientModel.ClientResult SendRecord(global::System.Collections.Generic.IDictionary<string, global::System.Collections.Generic.IList<ulong>> body, global::System.Threading.CancellationToken cancellationToken = default)
{
    global::Sample.Argument.AssertNotNull(body, nameof(body));

    using global::System.ClientModel.BinaryContent content = global::Sample.BinaryContentHelper.FromDictionary(body);
    return this.SendRecord(content, cancellationToken.ToRequestOptions());
}
public virtual async global::System.Threading.Tasks.Task<global::System.ClientModel.ClientResult> SendRecordAsync(global::System.Collections.Generic.IDictionary<string, global::System.Collections.Generic.IList<ulong>> body, global::System.Threading.CancellationToken cancellationToken = default)
{
    global::Sample.Argument.AssertNotNull(body, nameof(body));

    using global::System.ClientModel.BinaryContent content = global::Sample.BinaryContentHelper.FromDictionary(body);
    return await this.SendRecordAsync(content, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
}
