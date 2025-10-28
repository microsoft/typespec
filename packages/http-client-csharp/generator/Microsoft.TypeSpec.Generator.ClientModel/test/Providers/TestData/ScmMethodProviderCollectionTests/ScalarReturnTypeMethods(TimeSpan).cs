global::System.ClientModel.ClientResult result = this.GetScalar(cancellationToken.ToOptions());
return global::System.ClientModel.ClientResult.FromValue(result.GetRawResponse().Content.ToObjectFromJson<global::System.TimeSpan>(), result.GetRawResponse());
