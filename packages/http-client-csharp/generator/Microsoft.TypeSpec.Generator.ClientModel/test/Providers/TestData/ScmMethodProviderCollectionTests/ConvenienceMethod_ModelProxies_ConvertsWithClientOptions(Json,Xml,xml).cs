global::Sample.Argument.AssertNotNull(body, nameof(body));

using global::System.ClientModel.BinaryContent content = body.ToBinaryContent(_modelReaderWriterOptions.ToXmlOptions());
global::System.ClientModel.ClientResult result = this.UpdateModel(content, cancellationToken.ToRequestOptions());
return global::System.ClientModel.ClientResult.FromValue(global::Sample.Models.TestModel.FromClientResult(result, _modelReaderWriterOptions), result.GetRawResponse());
