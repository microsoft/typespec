using System;

namespace Sample.Models
{
    public partial class StringFieldDataset
    {
        public new string DataUri;
    }

    public partial class UriFieldDataset
    {
        public new Uri DataUri;
    }

    public partial class MethodDataset
    {
        public new void DataUri() { }
    }

    public partial class EventDataset
    {
        public new event Action DataUri;
    }

    public partial class NestedTypeDataset
    {
        public new class DataUri { }
    }
}
