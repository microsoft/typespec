using System.IO;

namespace Payload.MultiPart.Models
{
    public partial class FileRequiredMetaData
    {
        public FileRequiredMetaData(Stream contents, string filename, string contentType)
        {
            Argument.AssertNotNull(contents, nameof(contents));
            Argument.AssertNotNull(filename, nameof(filename));
            Argument.AssertNotNull(contentType, nameof(contentType));

            Contents = contents;
            Filename = filename;
            ContentType = contentType;
        }

        public Stream Contents { get; }
        public string Filename { get; }
        public string ContentType { get; }
    }
}
