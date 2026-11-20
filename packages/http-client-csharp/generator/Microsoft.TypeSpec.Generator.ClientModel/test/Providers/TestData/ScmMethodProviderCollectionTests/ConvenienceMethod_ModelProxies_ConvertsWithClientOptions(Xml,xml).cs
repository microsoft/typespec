global::Sample.Argument.AssertNotNull(body, nameof(body));

global::System.ClientModel.ClientResult result = this.UpdateModel(body.ToBinaryContent(_modelReaderWriterOptions), cancellationToken.ToRequestOptions());
return global::System.ClientModel.ClientResult.FromValue(global::Sample.Models.TestModel.FromClientResult(result, _modelReaderWriterOptions), result.GetRawResponse());
