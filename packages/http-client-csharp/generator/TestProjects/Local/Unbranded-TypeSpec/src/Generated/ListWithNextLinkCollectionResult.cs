// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;

namespace UnbrandedTypeSpec
{
    internal partial class ListWithNextLinkCollectionResult : CollectionResult
    {
        private readonly SampleTypeSpecClient _client;
        private readonly Uri _nextPage;
        private readonly RequestOptions _options;

        public ListWithNextLinkCollectionResult(SampleTypeSpecClient client, Uri nextPage, RequestOptions options)
        {
            _client = client;
            _nextPage = nextPage;
            _options = options;
        }

        public override IEnumerable<ClientResult> GetRawPages()
        {
            PipelineMessage message = _client.CreateListWithNextLinkRequest(_nextPage, _options);
            Uri nextPageUri = null;
            while (true)
            {
                ClientResult result = ClientResult.FromResponse(_client.Pipeline.ProcessMessage(message, _options));
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
    }
}
