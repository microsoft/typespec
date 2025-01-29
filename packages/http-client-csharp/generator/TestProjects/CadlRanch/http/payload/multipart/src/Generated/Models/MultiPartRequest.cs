#nullable disable

using System.ClientModel.Primitives;

namespace Payload.MultiPart.Models
{
    public partial class MultiPartRequest
    {
        public MultiPartRequest(string id, MultiPartFile profileImage)
        {
            Argument.AssertNotNull(id, nameof(id));
            Argument.AssertNotNull(profileImage, nameof(profileImage));

            Id = id;
            ProfileImage = profileImage;
        }

        public string Id { get; }
        public MultiPartFile ProfileImage { get; }
    }
}
