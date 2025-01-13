using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Text;

namespace Payload.MultiPart.Models
{
    public partial class ComplexPartsRequest
    {
        internal MultiPartFormDataBinaryContent ToMultipartContent()
        {
            MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();

            content.Add(Id, "id");
            content.Add(ModelReaderWriter.Write(Address, ModelSerializationExtensions.WireOptions), "address");
            content.Add(ProfileImage.Contents, "profileImage", ProfileImage.Filename, ProfileImage.ContentType);


            foreach (var picture in Pictures)
            {
                content.Add(picture.Contents, "pictures", picture.Filename, picture.ContentType);
            }

            return content;
        }
    }
}
