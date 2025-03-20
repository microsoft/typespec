
using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Sample
{
    /// <summary></summary>
    public partial class TestClient
    {
        public virtual ClientResult NewMethodOne(BinaryContent content, RequestOptions options)
        {
            Argument.AssertNotNull(content, nameof(content));

            using PipelineMessage message = CreateRequest(content, options);
            return ClientResult.FromResponse(Pipeline.ProcessMessage(message, options));
        }

        public void NewMethodTwo() { }

        public void NewMethodThree(CustomModel p1) { }
        public bool NewMethodFour(CustomModel? p1) { return false; }
    }

    public class CustomModel { }
}
