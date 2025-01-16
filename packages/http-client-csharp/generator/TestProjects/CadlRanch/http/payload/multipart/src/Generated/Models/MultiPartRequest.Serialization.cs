using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Text;

namespace Payload.MultiPart.Models
{
    public partial class MultiPartRequest
    {
        
        internal MultiPartFormDataBinaryContent ToMultipartContent()
        {
            MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();

            content.Add(ProfileImage.Contents, "profileImage", ProfileImage.Filename, ProfileImage.ContentType);
            content.Add(Id, "id");

            return content;
        }
    }
}
