using System.ClientModel.Primitives;

namespace Payload.MultiPart.Models
{
    public partial class ComplexHttpPartsModelRequest
    {
        internal MultiPartFormDataBinaryContent ToMultipartContent()
        {
            MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();

            content.Add(Id, "id");
            content.Add(ModelReaderWriter.Write(Address, ModelSerializationExtensions.WireOptions), "address");
            content.Add(ProfileImage.Contents, "profileImage", ProfileImage.Filename, ProfileImage.ContentType);

            foreach (Address item in PreviousAddresses)
            {
                content.Add(ModelReaderWriter.Write(item, ModelSerializationExtensions.WireOptions), "previousAddresses");
            }

            foreach (var picture in Pictures)
            {
                content.Add(picture.Contents, "pictures", picture.Filename, picture.ContentType);
            }

            return content;
        }
    }
}
