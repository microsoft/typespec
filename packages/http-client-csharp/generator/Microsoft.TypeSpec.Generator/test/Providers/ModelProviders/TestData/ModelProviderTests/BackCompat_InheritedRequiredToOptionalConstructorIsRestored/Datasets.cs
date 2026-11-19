using System;

namespace Sample.Models
{
    public abstract partial class AIProjectDataset
    {
        private protected AIProjectDataset(Uri dataUri, string kind)
        {
            DataUri = dataUri;
            Kind = kind;
        }

        public Uri DataUri { get; set; }
        internal string Kind { get; set; }
    }

    public partial class FileDataset : AIProjectDataset
    {
        public FileDataset(Uri dataUri) : base(dataUri, "file")
        {
            ArgumentNullException.ThrowIfNull(dataUri);
        }
    }

    public partial class FolderDataset : AIProjectDataset
    {
        public FolderDataset(Uri dataUri) : base(dataUri, "folder")
        {
            ArgumentNullException.ThrowIfNull(dataUri);
        }
    }
}
