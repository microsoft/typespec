// <auto-generated/>

#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SampleTypeSpec
{
    internal partial class SampleTypeSpecClientListWithPagingAsyncCollectionResultOfT : AsyncCollectionResult<Thing>
    {
        private readonly SampleTypeSpecClient _client;
        private readonly RequestOptions _options;

        public SampleTypeSpecClientListWithPagingAsyncCollectionResultOfT(SampleTypeSpecClient client, RequestOptions options)
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
