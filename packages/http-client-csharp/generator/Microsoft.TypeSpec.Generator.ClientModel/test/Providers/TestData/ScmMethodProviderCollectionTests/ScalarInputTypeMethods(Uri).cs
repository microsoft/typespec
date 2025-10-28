﻿global::Sample.Argument.AssertNotNull(value, nameof(value));

global::Sample.Utf8JsonBinaryContent content = new global::Sample.Utf8JsonBinaryContent();
content.JsonWriter.WriteStringValue(value.AbsoluteUri);
return this.PutScalar(content, cancellationToken.CanBeCanceled ? new global::System.ClientModel.Primitives.RequestOptions { CancellationToken = cancellationToken } : null);
