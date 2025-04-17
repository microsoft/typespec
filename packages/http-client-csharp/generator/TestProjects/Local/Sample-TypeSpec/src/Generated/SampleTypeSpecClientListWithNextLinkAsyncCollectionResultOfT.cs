// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SampleTypeSpec
{
    internal partial class SampleTypeSpecClientListWithNextLinkAsyncCollectionResultOfT : AsyncCollectionResult<Thing>
    {
        private readonly SampleTypeSpecClient _client;
        private readonly Uri _nextPage;
        private readonly RequestOptions _options;

        public SampleTypeSpecClientListWithNextLinkAsyncCollectionResultOfT(SampleTypeSpecClient client, Uri nextPage, RequestOptions options)
        {
            _client = client;
            _nextPage = nextPage;
            _options = options;
        }

        public override async IAsyncEnumerable<ClientResult> GetRawPagesAsync()
        {
            PipelineMessage message = _client.CreateListWithNextLinkRequest(_nextPage, _options);
            Uri nextPageUri = null;
            while (true)
            {
                ClientResult result = ClientResult.FromResponse(await _client.Pipeline.ProcessMessageAsync(message, _options).ConfigureAwait(false));
                yield return result;

                nextPageUri = ((ListWithNextLinkResponse)result).Next;
                if (nextPageUri == null)
                {
                    yield break;
                }
                message = _client.CreateListWithNextLinkRequest(nextPageUri, _options);
            }
        }

        public override ContinuationToken GetContinuationToken(ClientResult page)
        {
            Uri nextPage = ((ListWithNextLinkResponse)page).Next;
            if (nextPage != null)
            {
                return ContinuationToken.FromBytes(BinaryData.FromString(nextPage.AbsoluteUri));
            }
            else
            {
                return null;
            }
        }

        protected override async IAsyncEnumerable<Thing> GetValuesFromPageAsync(ClientResult page)
        {
            foreach (Thing item in ((ListWithNextLinkResponse)page).Things)
            {
                yield return item;
                await Task.Yield();
            }
        }
    }
}
