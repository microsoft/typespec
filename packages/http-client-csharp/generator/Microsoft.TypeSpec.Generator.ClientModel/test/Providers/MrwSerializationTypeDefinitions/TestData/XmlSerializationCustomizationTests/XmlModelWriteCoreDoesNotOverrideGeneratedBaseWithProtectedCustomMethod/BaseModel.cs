#nullable disable

using System.ClientModel.Primitives;
using System.Xml;

namespace Sample.Models;

public partial class BaseModel
{
    protected virtual void XmlModelWriteCore(XmlWriter writer, ModelReaderWriterOptions options)
    {
    }
}
