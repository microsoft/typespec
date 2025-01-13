using System.Collections.Generic;
using System.Linq;

namespace Payload.MultiPart.Models
{
    public partial class ComplexHttpPartsModelRequest
    {
        public ComplexHttpPartsModelRequest(string id, Address address, FileRequiredMetaData profileImage, IEnumerable<Address> previousAddresses, IEnumerable<FileRequiredMetaData> pictures)
        {
            Argument.AssertNotNull(id, nameof(id));
            Argument.AssertNotNull(address, nameof(address));
            Argument.AssertNotNull(profileImage, nameof(profileImage));
            Argument.AssertNotNull(previousAddresses, nameof(previousAddresses));
            Argument.AssertNotNull(pictures, nameof(pictures));

            Id = id;
            Address = address;
            ProfileImage = profileImage;
            PreviousAddresses = previousAddresses.ToList();
            Pictures = pictures.ToList();
        }

        public string Id { get; }
        public Address Address { get; }
        public FileRequiredMetaData ProfileImage { get; }
        public IList<Address> PreviousAddresses { get; }
        public IList<FileRequiredMetaData> Pictures { get; }
    }
}
