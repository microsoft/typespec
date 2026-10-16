global::Sample.Argument.AssertNotNull(body, nameof(body));

using global::System.ClientModel.BinaryContent content = global::Sample.BinaryContentHelper.FromEnumerable(body);
return this.SendNested(content, cancellationToken.ToRequestOptions());
global::Sample.Argument.AssertNotNull(body, nameof(body));

using global::System.ClientModel.BinaryContent content = global::Sample.BinaryContentHelper.FromEnumerable(body);
return await this.SendNestedAsync(content, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
global::Sample.Argument.AssertNotNull(body, nameof(body));

using global::System.ClientModel.BinaryContent content = global::Sample.BinaryContentHelper.FromDictionary(body);
return this.SendRecord(content, cancellationToken.ToRequestOptions());
global::Sample.Argument.AssertNotNull(body, nameof(body));

using global::System.ClientModel.BinaryContent content = global::Sample.BinaryContentHelper.FromDictionary(body);
return await this.SendRecordAsync(content, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
