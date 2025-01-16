#nullable disable

using System.IO;

namespace Payload.MultiPart.Models
{
    public partial class FileOptionalContentType
    {
        public FileOptionalContentType(Stream contents, string filename)
        {
            Argument.AssertNotNull(contents, nameof(contents));
            Argument.AssertNotNull(filename, nameof(filename));

            Contents = contents;
            Filename = filename;
        }

        public Stream Contents { get; }
        public string Filename { get; }
        public string ContentType { get; set; }
    }
}
