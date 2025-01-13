#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

namespace Payload.MultiPart.Models
{
    public partial class FloatRequest
    {
        
        internal virtual MultiPartFormDataBinaryContent ToMultipartContent()
        {
            MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            content.Add(Temperature.Temperature, "temperature", contentType: Temperature.ContentType.ToString());
            return content;
        }
    }
}
