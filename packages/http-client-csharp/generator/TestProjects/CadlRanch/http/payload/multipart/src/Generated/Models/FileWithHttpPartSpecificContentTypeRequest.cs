using System;

namespace Payload.MultiPart.Models
{
    public partial class FileWithHttpPartSpecificContentTypeRequest
    {
        public FileWithHttpPartSpecificContentTypeRequest(FileSpecificContentType profileImage)
        {
            Argument.AssertNotNull(profileImage, nameof(profileImage));

            ProfileImage = profileImage;
        }

        /// <summary> Gets the profile image. </summary>
        public FileSpecificContentType ProfileImage { get; }
    }
}
