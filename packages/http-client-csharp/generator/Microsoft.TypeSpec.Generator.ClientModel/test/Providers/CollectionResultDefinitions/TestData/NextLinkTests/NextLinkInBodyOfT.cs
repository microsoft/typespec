// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using Sample.Models;

namespace Sample
{
    internal partial class GetCatsCollectionResultOfT : global::System.ClientModel.CollectionResult<global::Sample.Models.Cat>
    {
        private readonly global::Sample.CatClient _client;
        private readonly global::System.Uri _nextPage;
        private readonly global::System.ClientModel.Primitives.RequestOptions _options;

        public GetCatsCollectionResultOfT(global::Sample.CatClient client, global::System.Uri nextPage, global::System.ClientModel.Primitives.RequestOptions options)
        {
            _client = client;
            _nextPage = nextPage;
            _options = options;
        }

        public override global::System.Collections.Generic.IEnumerable<global::System.ClientModel.ClientResult> GetRawPages()
        {
            global::System.ClientModel.Primitives.PipelineMessage message = _client.CreateGetCatsRequest(_nextPage, _options);
            global::System.Uri nextPageUri = null;
            while (true)
            {
                global::System.ClientModel.ClientResult result = global::System.ClientModel.ClientResult.FromResponse(_client.Pipeline.ProcessMessage(message, _options));
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
            global::System.Uri nextPage = ((global::Sample.Models.Page)page).NextCat;
            return global::System.ClientModel.ContinuationToken.FromBytes(global::System.BinaryData.FromString(nextPage.AbsoluteUri));
        }

        protected override global::System.Collections.Generic.IEnumerable<global::Sample.Models.Cat> GetValuesFromPage(global::System.ClientModel.ClientResult page)
        {
            return ((global::Sample.Models.Page)page).Cats;
        }
    }
}
