#nullable disable

using System.ClientModel.Primitives;

namespace Payload.MultiPart.Models
{
    public partial class JsonPartRequest
    {

        internal virtual MultiPartFormDataBinaryContent ToMultipartBinaryBody()
        {
            MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            content.Add(ModelReaderWriter.Write(Address, ModelSerializationExtensions.WireOptions), "address");
            // TO-DO: How do we know which model is a file?
            // Possible solution: When creating the file model in the emitter, the emitter can add a new nullable property
            // 'isFile' to the model. If the property is not null or true, then the model is a file.
            content.Add(ProfileImage.Contents, "profileImage", ProfileImage.Filename, ProfileImage.ContentType);
            return content;
        }
    }
}
