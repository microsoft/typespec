global::Sample.Argument.AssertNotNull(body, nameof(body));

using global::System.ClientModel.BinaryContent content = global::Sample.BinaryContentHelper.FromEnumerable(body, "SignedIdentifiers", "SignedIdentifier");
return this.Foo(content, cancellationToken.ToRequestOptions());
