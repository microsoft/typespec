global::System.ClientModel.ClientResult result = this.GetFoo(cancellationToken.ToRequestOptions());
global::System.BinaryData data = result.GetRawResponse().Content;
return global::System.ClientModel.ClientResult.FromValue(((global::System.Collections.Generic.IList<global::Sample.Models.SignedIdentifier>)global::System.ClientModel.Primitives.ModelReaderWriter.Read<global::System.Collections.Generic.IList<global::Sample.Models.SignedIdentifier>>(data, _modelReaderWriterOptions, global::Sample.SampleContext.Default)), result.GetRawResponse());
