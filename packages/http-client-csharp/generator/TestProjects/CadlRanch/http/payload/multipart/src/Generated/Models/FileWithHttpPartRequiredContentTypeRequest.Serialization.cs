namespace Payload.MultiPart.Models
{
    public partial class FileWithHttpPartRequiredContentTypeRequest
    {
        
        internal MultiPartFormDataBinaryContent ToMultipartContent()
        {
            MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();

            content.Add(ProfileImage.Contents, "profileImage", ProfileImage.Filename, ProfileImage.ContentType);

            return content;
        }
    }
}
