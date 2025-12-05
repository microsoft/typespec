global::System.ClientModel.ClientResult result = this.GetData(cancellationToken.ToRequestOptions());
return global::System.ClientModel.ClientResult.FromValue(global::System.ClientModel.Primitives.ModelReaderWriter.Read<int>(result.GetRawResponse().Content, global::Sample.ModelSerializationExtensions.WireOptions, global::Sample.SampleContext.Default).ToTestEnum(), result.GetRawResponse());
