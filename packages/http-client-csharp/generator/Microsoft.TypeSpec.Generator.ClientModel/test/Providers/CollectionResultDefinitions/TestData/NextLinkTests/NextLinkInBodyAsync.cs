// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using Sample.Models;

namespace Sample
{
    internal partial class GetCatsAsyncCollectionResult : global::System.ClientModel.Primitives.AsyncCollectionResult
    {
        private readonly global::Sample.CatClient _client;
        private readonly global::System.Uri _initialUri;
        private readonly global::System.ClientModel.Primitives.RequestOptions _options;

        public GetCatsAsyncCollectionResult(global::Sample.CatClient client, global::System.Uri initialUri, global::System.ClientModel.Primitives.RequestOptions options)
        {
            _client = client;
            _initialUri = initialUri;
            _options = options;
        }

        public override async global::System.Collections.Generic.IAsyncEnumerable<global::System.ClientModel.ClientResult> GetRawPagesAsync()
        {
            global::System.ClientModel.Primitives.PipelineMessage message = _client.CreateGetCatsRequest(_initialUri, true, _options);
            global::System.Uri nextPageUri = null;
            while (true)
            {
                global::System.ClientModel.ClientResult result = global::System.ClientModel.ClientResult.FromResponse(await _client.Pipeline.ProcessMessageAsync(message, _options).ConfigureAwait(false));
                yield return result;

                nextPageUri = ((global::Sample.Models.Page)result).NextCat;
                if ((nextPageUri == null))
                {
                    yield break;
                }
                message = _client.CreateGetCatsRequest(nextPageUri, false, _options);
            }
        }

        public override global::System.ClientModel.ContinuationToken GetContinuationToken(global::System.ClientModel.ClientResult page)
        {
            global::System.Uri nextPageUri = ((global::Sample.Models.Page)page).NextCat;
            return global::System.ClientModel.ContinuationToken.FromBytes(global::System.BinaryData.FromString(nextPageUri.AbsoluteUri));
        }
    }
}
