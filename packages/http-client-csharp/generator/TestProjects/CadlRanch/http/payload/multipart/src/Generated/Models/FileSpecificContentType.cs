using System;
using System.ClientModel.Primitives;
using System.IO;

namespace Payload.MultiPart.Models
{
    public partial class FileSpecificContentType : MultiPartFile
    {
        public FileSpecificContentType(Stream contents, string filename) : base(contents, filename, "image/jpg")
        {
            Argument.AssertNotNull(contents, nameof(contents));
            Argument.AssertNotNull(filename, nameof(filename));
        }

        public FileSpecificContentType(BinaryData contents, string filename) : base(contents, filename, "image/jpg")
        {
            Argument.AssertNotNull(contents, nameof(contents));
            Argument.AssertNotNull(filename, nameof(filename));
        }
    }
}
