﻿namespace Payload.MultiPart.Models
{
    public partial class FileWithHttpPartRequiredContentTypeRequest
    {
        public FileWithHttpPartRequiredContentTypeRequest(FileRequiredMetaData profileImage)
        {
            Argument.AssertNotNull(profileImage, nameof(profileImage));

            ProfileImage = profileImage;
        }

        /// <summary> Gets the profile image. </summary>
        public FileRequiredMetaData ProfileImage { get; }
    }
}
