#nullable disable

using System;
using System.ClientModel.Primitives;
using System.IO;

namespace Payload.MultiPart.Models
{
    public partial class FileOptionalContentType : MultiPartFile
    {
        public FileOptionalContentType(Stream contents, string filename, string contentType = default) : base(contents, filename, contentType)
        {
            Argument.AssertNotNull(contents, nameof(contents));
            Argument.AssertNotNull(filename, nameof(filename));
        }

        public FileOptionalContentType(BinaryData contents, string filename, string contentType = default) : base(contents, filename, contentType)
        {
            Argument.AssertNotNull(contents, nameof(contents));
            Argument.AssertNotNull(filename, nameof(filename));
        }
    }
}
