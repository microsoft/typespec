// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;

namespace Sample
{
    internal partial class CatClientGetCatsCollectionResult : global::System.ClientModel.Primitives.CollectionResult
    {
        private readonly global::Sample.CatClient _client;
        private readonly global::System.Uri _nextPage;
        private readonly global::System.ClientModel.Primitives.RequestOptions _options;

        public CatClientGetCatsCollectionResult(global::Sample.CatClient client, global::System.Uri nextPage, global::System.ClientModel.Primitives.RequestOptions options)
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

                if (result.GetRawResponse().Headers.TryGetValue("nextCat", out string value))
                {
                    nextPageUri = new global::System.Uri(value);
                }
                else
                {
                    yield break;
                }
                message = _client.CreateGetCatsRequest(nextPageUri, _options);
            }
        }

        public override global::System.ClientModel.ContinuationToken GetContinuationToken(global::System.ClientModel.ClientResult page)
        {
            if (page.GetRawResponse().Headers.TryGetValue("nextCat", out string value))
            {
                return global::System.ClientModel.ContinuationToken.FromBytes(global::System.BinaryData.FromString(value));
            }
            else
            {
                return null;
            }
        }
    }
}
