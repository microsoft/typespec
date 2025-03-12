// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Threading.Tasks;
using Sample.Models;

namespace Sample
{
    internal partial class GetCatsAsyncCollectionResultOfT : global::System.ClientModel.AsyncCollectionResult<global::Sample.Models.Cat>
    {
        private readonly global::Sample.CatClient _client;
        private readonly global::System.Uri _initialUri;
        private readonly global::System.ClientModel.Primitives.RequestOptions _options;

        public GetCatsAsyncCollectionResultOfT(global::Sample.CatClient client, global::System.Uri initialUri, global::System.ClientModel.Primitives.RequestOptions options)
        {
            _client = client;
            _initialUri = initialUri;
            _options = options;
        }

        public override async global::System.Collections.Generic.IAsyncEnumerable<global::System.ClientModel.ClientResult> GetRawPagesAsync()
        {
            global::System.ClientModel.Primitives.PipelineMessage message = _client.CreateGetCatsRequest(_initialUri, _options);
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
                message = _client.CreateGetCatsRequest(nextPageUri, _options);
            }
        }

        public override global::System.ClientModel.ContinuationToken GetContinuationToken(global::System.ClientModel.ClientResult page)
        {
            global::System.Uri nextPageUri = ((global::Sample.Models.Page)page).NextCat;
            return global::System.ClientModel.ContinuationToken.FromBytes(global::System.BinaryData.FromString(nextPageUri.AbsoluteUri));
        }

        protected override async global::System.Collections.Generic.IAsyncEnumerable<global::Sample.Models.Cat> GetValuesFromPageAsync(global::System.ClientModel.ClientResult page)
        {
            foreach (global::Sample.Models.Cat item in ((global::Sample.Models.Page)page).Cats)
            {
                yield return item;
                await global::System.Threading.Tasks.Task.Yield();
            }
        }
    }
}
