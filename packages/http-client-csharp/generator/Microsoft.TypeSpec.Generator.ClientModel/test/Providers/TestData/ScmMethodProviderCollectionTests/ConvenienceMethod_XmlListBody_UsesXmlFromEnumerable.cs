global::Sample.Argument.AssertNotNull(body, nameof(body));

using global::System.ClientModel.BinaryContent content = global::Sample.BinaryContentHelper.FromEnumerable(body, "list", "SignedIdentifier", _modelReaderWriterOptions);
return this.Foo(content, cancellationToken.ToRequestOptions());
