#nullable disable

using System.ClientModel.Primitives;
using System.Xml;

namespace Sample.Models;

public partial class MockInputModel : ProtectedInternalXmlBase
{
}

public class ProtectedInternalXmlBase
{
    protected internal virtual void XmlModelWriteCore(XmlWriter writer, ModelReaderWriterOptions options)
    {
    }
}
