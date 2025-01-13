#nullable disable

using System;
using System.Collections.Generic;

namespace Payload.MultiPart.Models
{
    public partial class MultiPartRequest
    {
        public MultiPartRequest(string id, ProfileImageFileDetails profileImage)
        {
            Argument.AssertNotNull(id, nameof(id));
            Argument.AssertNotNull(profileImage, nameof(profileImage));

            Id = id;
            ProfileImage = profileImage;
        }

        public string Id { get; }
        public ProfileImageFileDetails ProfileImage { get; }
    }
}
