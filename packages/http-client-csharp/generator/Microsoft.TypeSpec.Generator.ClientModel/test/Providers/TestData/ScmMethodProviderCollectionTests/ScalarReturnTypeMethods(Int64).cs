global::System.ClientModel.ClientResult result = this.GetScalar(cancellationToken.CanBeCanceled ? new global::System.ClientModel.Primitives.RequestOptions { CancellationToken = cancellationToken } : null);
return global::System.ClientModel.ClientResult.FromValue(result.GetRawResponse().Content.ToObjectFromJson<long>(), result.GetRawResponse());
