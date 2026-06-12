using System.ClientModel;

namespace Sample.Models
{
    public partial class UnreferencedModel
    {
        public static implicit operator BinaryContent(UnreferencedModel model)
        {
            return BinaryContent.Create(model);
        }

        public static explicit operator UnreferencedModel(ClientResult result)
        {
            PipelineResponse response = result.GetRawResponse();
            return new UnreferencedModel();
        }
    }
}
