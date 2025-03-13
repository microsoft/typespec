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
        private readonly string _myToken;
        private readonly global::System.ClientModel.Primitives.RequestOptions _options;

        public GetCatsCollectionResultOfT(global::Sample.CatClient client, string myToken, global::System.ClientModel.Primitives.RequestOptions options)
        {
            global::Sample.Argument.AssertNotNull(myToken, nameof(myToken));

            _client = client;
            _myToken = myToken;
            _options = options;
        }

        public override global::System.Collections.Generic.IEnumerable<global::System.ClientModel.ClientResult> GetRawPages()
        {
            global::System.ClientModel.Primitives.PipelineMessage message = _client.CreateGetCatsRequest(_myToken, _options);
            string nextToken = null;
            while (true)
            {
                global::System.ClientModel.ClientResult result = global::System.ClientModel.ClientResult.FromResponse(_client.Pipeline.ProcessMessage(message, _options));
                yield return result;

                nextToken = ((global::Sample.Models.Page)result).NextPage;
                if ((nextToken == null))
                {
                    yield break;
                }
                message = _client.CreateGetCatsRequest(nextToken, _options);
            }
        }

        public override global::System.ClientModel.ContinuationToken GetContinuationToken(global::System.ClientModel.ClientResult page)
        {
            string nextPage = ((global::Sample.Models.Page)page).NextPage;
            return global::System.ClientModel.ContinuationToken.FromBytes(global::System.BinaryData.FromString(nextPage));
        }

        protected override global::System.Collections.Generic.IEnumerable<global::Sample.Models.Cat> GetValuesFromPage(global::System.ClientModel.ClientResult page)
        {
            return ((global::Sample.Models.Page)page).Cats;
        }
    }
}
