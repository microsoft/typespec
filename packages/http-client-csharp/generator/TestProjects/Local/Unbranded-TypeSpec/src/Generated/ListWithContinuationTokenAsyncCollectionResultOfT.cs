// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace UnbrandedTypeSpec
{
    internal partial class ListWithContinuationTokenAsyncCollectionResultOfT : AsyncCollectionResult<Thing>
    {
        private readonly UnbrandedTypeSpecClient _client;
        private readonly string _token;
        private readonly RequestOptions _options;

        public ListWithContinuationTokenAsyncCollectionResultOfT(UnbrandedTypeSpecClient client, string token, RequestOptions options)
        {
            _client = client;
            _token = token;
            _options = options;
        }

        public override async IAsyncEnumerable<ClientResult> GetRawPagesAsync()
        {
            PipelineMessage message = _client.CreateListWithContinuationTokenRequest(_token, _options);
            string nextToken = null;
            while (true)
            {
                ClientResult result = ClientResult.FromResponse(await _client.Pipeline.ProcessMessageAsync(message, _options).ConfigureAwait(false));
                yield return result;

                nextToken = ((ListWithContinuationTokenResponse)result).NextToken;
                if (nextToken == null)
                {
                    yield break;
                }
                message = _client.CreateListWithContinuationTokenRequest(nextToken, _options);
            }
        }

        public override ContinuationToken GetContinuationToken(ClientResult page)
        {
            string nextPage = ((ListWithContinuationTokenResponse)page).NextToken;
            if (nextPage != null)
            {
                return ContinuationToken.FromBytes(BinaryData.FromString(nextPage));
            }
            else
            {
                return null;
            }
        }

        protected override async IAsyncEnumerable<Thing> GetValuesFromPageAsync(ClientResult page)
        {
            foreach (Thing item in ((ListWithContinuationTokenResponse)page).Things)
            {
                yield return item;
                await Task.Yield();
            }
        }
    }
}
