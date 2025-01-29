#nullable disable

using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;

namespace Payload.MultiPart.Models
{
    public partial class ComplexPartsRequest
    {
        public ComplexPartsRequest(string id, Address address, MultiPartFile profileImage, IEnumerable<MultiPartFile> pictures)
        {
            Argument.AssertNotNull(id, nameof(id));
            Argument.AssertNotNull(address, nameof(address));
            Argument.AssertNotNull(profileImage, nameof(profileImage));
            Argument.AssertNotNull(pictures, nameof(pictures));

            Id = id;
            Address = address;
            ProfileImage = profileImage;
            Pictures = pictures.ToList();
        }

        public string Id { get; }
        public Address Address { get; }
        public MultiPartFile ProfileImage { get; }
        public IList<MultiPartFile> Pictures { get; }
    }
}
