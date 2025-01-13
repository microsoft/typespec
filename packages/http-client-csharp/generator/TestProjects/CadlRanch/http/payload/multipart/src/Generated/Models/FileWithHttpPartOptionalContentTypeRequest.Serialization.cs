using System;
using System.Collections.Generic;
using System.Text;

namespace Payload.MultiPart.Models
{
    public partial class FileWithHttpPartOptionalContentTypeRequest
    {
        
        internal MultiPartFormDataBinaryContent ToMultipartContent()
        {
            MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();

            content.Add(ProfileImage.Contents, "profileImage", ProfileImage.Filename, ProfileImage.ContentType);

            return content;
        }
    }
}
