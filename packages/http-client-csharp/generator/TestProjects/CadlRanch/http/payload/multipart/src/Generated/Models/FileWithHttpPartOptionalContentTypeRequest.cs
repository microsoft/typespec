﻿namespace Payload.MultiPart.Models
{
    public partial class FileWithHttpPartOptionalContentTypeRequest
    {
        public FileWithHttpPartOptionalContentTypeRequest(FileOptionalContentType profileImage)
        {
            Argument.AssertNotNull(profileImage, nameof(profileImage));

            ProfileImage = profileImage;
        }

        /// <summary> Gets the profile image. </summary>
        public FileOptionalContentType ProfileImage { get; }
    }
}
