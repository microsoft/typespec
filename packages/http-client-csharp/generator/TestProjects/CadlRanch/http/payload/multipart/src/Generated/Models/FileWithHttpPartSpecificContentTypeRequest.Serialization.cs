using System;

namespace Payload.MultiPart.Models
{
    public partial class FileWithHttpPartSpecificContentTypeRequest
    {
        
        internal MultiPartFormDataBinaryContent ToMultipartContent()
        {
            MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();

            content.Add(ProfileImage.Contents, "profileImage", ProfileImage.Filename, ProfileImage.ContentType.ToString());

            return content;
        }
    }
}
