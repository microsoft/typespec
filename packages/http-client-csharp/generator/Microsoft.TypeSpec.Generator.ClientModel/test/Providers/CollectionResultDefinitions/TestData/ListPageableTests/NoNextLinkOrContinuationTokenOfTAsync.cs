// <auto-generated/>

#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Threading.Tasks;
using Sample.Models;

namespace Sample
{
    internal partial class CatClientGetCatsAsyncCollectionResultOfT : global::System.ClientModel.AsyncCollectionResult<global::Sample.Models.Cat>
    {
        private readonly global::Sample.CatClient _client;
        private readonly string _animalKind;
        private readonly global::System.ClientModel.Primitives.RequestOptions _options;

        public CatClientGetCatsAsyncCollectionResultOfT(global::Sample.CatClient client, string animalKind, global::System.ClientModel.Primitives.RequestOptions options)
        {
            global::Sample.Argument.AssertNotNull(animalKind, nameof(animalKind));

            _client = client;
            _animalKind = animalKind;
            _options = options;
        }

        public override async global::System.Collections.Generic.IAsyncEnumerable<global::System.ClientModel.ClientResult> GetRawPagesAsync()
        {
            global::System.ClientModel.Primitives.PipelineMessage message = _client.CreateGetCatsRequest(_animalKind, _options);
            yield return global::System.ClientModel.ClientResult.FromResponse(await _client.Pipeline.ProcessMessageAsync(message, _options).ConfigureAwait(false));
        }

        public override global::System.ClientModel.ContinuationToken GetContinuationToken(global::System.ClientModel.ClientResult page)
        {
            return null;
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
