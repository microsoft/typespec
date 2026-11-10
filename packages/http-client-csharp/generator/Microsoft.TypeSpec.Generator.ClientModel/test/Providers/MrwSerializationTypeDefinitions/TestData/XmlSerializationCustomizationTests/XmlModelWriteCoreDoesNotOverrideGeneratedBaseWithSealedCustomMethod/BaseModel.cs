#nullable disable

using System.ClientModel.Primitives;
using System.Xml;

namespace Sample.Models;

public partial class BaseModel : BaseModelXmlHook
{
    internal sealed override void XmlModelWriteCore(XmlWriter writer, ModelReaderWriterOptions options)
    {
    }
}

public class BaseModelXmlHook
{
    internal virtual void XmlModelWriteCore(XmlWriter writer, ModelReaderWriterOptions options)
    {
    }
}
