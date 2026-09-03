#nullable disable

using System.ClientModel.Primitives;
using System.Xml;

namespace Sample.Models;

public partial class BaseModel
{
    internal virtual void XmlModelWriteCore(XmlWriter writer, ModelReaderWriterOptions options)
    {
    }
}
