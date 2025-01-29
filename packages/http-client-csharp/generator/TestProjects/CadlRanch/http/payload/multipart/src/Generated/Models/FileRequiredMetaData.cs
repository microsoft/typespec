using System;
using System.ClientModel.Primitives;
using System.IO;

namespace Payload.MultiPart.Models
{
    public partial class FileRequiredMetaData : MultiPartFile
    {
        public FileRequiredMetaData(Stream contents, string filename, string contentType) : base(contents, filename, contentType)
        {
            Argument.AssertNotNull(contents, nameof(contents));
            Argument.AssertNotNull(filename, nameof(filename));
            Argument.AssertNotNull(contentType, nameof(contentType));
        }

        public FileRequiredMetaData(BinaryData contents, string filename, string contentType) : base(contents, filename, contentType)
        {
            Argument.AssertNotNull(contents, nameof(contents));
            Argument.AssertNotNull(filename, nameof(filename));
            Argument.AssertNotNull(contentType, nameof(contentType));
        }
    }
}
