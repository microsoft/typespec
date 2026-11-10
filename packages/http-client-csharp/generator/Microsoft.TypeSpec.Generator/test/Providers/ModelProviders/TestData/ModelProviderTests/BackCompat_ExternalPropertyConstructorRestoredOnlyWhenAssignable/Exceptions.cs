using System;

namespace Sample.Models
{
    public partial class MessageException : Exception
    {
        public MessageException(string message) : base(message)
        {
        }
    }

    public partial class SourceException : Exception
    {
        public SourceException(string source)
        {
            Source = source;
        }
    }

    public partial class MissingException : Exception
    {
        public MissingException(string missing) : base(missing)
        {
        }
    }

    public partial class HResultException : Exception
    {
        public HResultException(string hResult)
        {
            HResult = int.Parse(hResult);
        }
    }

    public partial class ProtectedHResultException : Exception
    {
        public ProtectedHResultException(int hResult)
        {
            HResult = hResult;
        }
    }

    public partial class NullableHResultException : Exception
    {
        public NullableHResultException(int? hResult)
        {
            HResult = hResult.GetValueOrDefault();
        }
    }

    public partial class InheritedSourceException : ArgumentException
    {
        public InheritedSourceException(string source)
        {
            Source = source;
        }
    }
}
