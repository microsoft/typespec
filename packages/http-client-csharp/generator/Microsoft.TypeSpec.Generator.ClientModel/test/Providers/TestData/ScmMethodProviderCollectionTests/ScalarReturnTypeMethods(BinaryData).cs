global::System.ClientModel.ClientResult result = this.GetScalar(cancellationToken.ToRequestOptions());
return global::System.ClientModel.ClientResult.FromValue(result.GetRawResponse().Content, result.GetRawResponse());
