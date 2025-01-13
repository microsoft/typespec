
#nullable disable

using System.IO;

namespace Payload.MultiPart.Models
{
    public partial class PicturesFileDetails
    {
        public PicturesFileDetails(Stream contents)
        {
            Argument.AssertNotNull(contents, nameof(contents));

            Contents = contents;
        }

        public Stream Contents { get; }
        public string Filename { get; set; }
        public string ContentType { get; set; }
    }
}
