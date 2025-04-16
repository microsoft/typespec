// <auto-generated/>

#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;
using Sample.Models;

namespace Sample
{
    /// <summary> testClient description. </summary>
    public partial class TestClient
    {
        public virtual async global::System.Threading.Tasks.Task<global::System.ClientModel.ClientResult> TestOperationAsync(global::Sample.Models.ModelWithQuery body, global::System.Threading.CancellationToken cancellationToken = default)
        {
            global::Sample.Argument.AssertNotNull(body, nameof(body));

            return await this.TestOperationAsync(body.Foo, body, cancellationToken.CanBeCanceled ? new global::System.ClientModel.Primitives.RequestOptions { CancellationToken = cancellationToken } : null).ConfigureAwait(false);
        }
    }
}
