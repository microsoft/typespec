using System;
using System.IO;

namespace Payload.MultiPart.Models
{
    public partial class FileSpecificContentType
    {
        public FileSpecificContentType(Stream contents, string filename)
        {
            Argument.AssertNotNull(contents, nameof(contents));
            Argument.AssertNotNull(filename, nameof(filename));

            Contents = contents;
            Filename = filename;
        }

        public Stream Contents { get; }
        public string Filename { get; }
        public FileSpecificContentTypeContentType ContentType { get; } = "image/jpg";
    }
}
