// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace UnbrandedTypeSpec
{
    internal partial class ListWithPagingAsyncCollectionResultOfT : AsyncCollectionResult<Thing>
    {
        private readonly UnbrandedTypeSpecClient _client;
        private readonly RequestOptions _options;

        public ListWithPagingAsyncCollectionResultOfT(UnbrandedTypeSpecClient client, RequestOptions options)
        {
            _client = client;
            _options = options;
        }

        public override async IAsyncEnumerable<ClientResult> GetRawPagesAsync()
        {
            PipelineMessage message = _client.CreateListWithPagingRequest(_options);
            yield return ClientResult.FromResponse(await _client.Pipeline.ProcessMessageAsync(message, _options).ConfigureAwait(false));
        }

        public override ContinuationToken GetContinuationToken(ClientResult page)
        {
            return null;
        }

        protected override async IAsyncEnumerable<Thing> GetValuesFromPageAsync(ClientResult page)
        {
            foreach (Thing item in ((PageThing)page).Items)
            {
                yield return item;
                await Task.Yield();
            }
        }
    }
}
