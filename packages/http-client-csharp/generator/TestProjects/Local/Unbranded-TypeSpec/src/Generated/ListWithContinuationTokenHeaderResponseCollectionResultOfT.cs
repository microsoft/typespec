// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;

namespace UnbrandedTypeSpec
{
    internal partial class ListWithContinuationTokenHeaderResponseCollectionResultOfT : CollectionResult<Thing>
    {
        private readonly UnbrandedTypeSpecClient _client;
        private readonly string _token;
        private readonly RequestOptions _options;

        public ListWithContinuationTokenHeaderResponseCollectionResultOfT(UnbrandedTypeSpecClient client, string token, RequestOptions options)
        {
            _client = client;
            _token = token;
            _options = options;
        }

        public override IEnumerable<ClientResult> GetRawPages()
        {
            PipelineMessage message = _client.CreateListWithContinuationTokenHeaderResponseRequest(_token, _options);
            string nextToken = null;
            while (true)
            {
                ClientResult result = ClientResult.FromResponse(_client.Pipeline.ProcessMessage(message, _options));
                yield return result;

                if (result.GetRawResponse().Headers.TryGetValue("next-token", out string value))
                {
                    nextToken = value;
                }
                else
                {
                    yield break;
                }
                message = _client.CreateListWithContinuationTokenHeaderResponseRequest(nextToken, _options);
            }
        }

        public override ContinuationToken GetContinuationToken(ClientResult page)
        {
            if (page.GetRawResponse().Headers.TryGetValue("next-token", out string value))
            {
                return ContinuationToken.FromBytes(BinaryData.FromString(value));
            }
            else
            {
                return null;
            }
        }

        protected override IEnumerable<Thing> GetValuesFromPage(ClientResult page)
        {
            return ((ListWithContinuationTokenHeaderResponseResponse)page).Things;
        }
    }
}
