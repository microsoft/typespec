// <auto-generated/>

#nullable disable

using System;
using System.ClientModel.Primitives;
using Encode.Bytes._Header;
using Encode.Bytes._Property;
using Encode.Bytes._Query;
using Encode.Bytes._RequestBody;
using Encode.Bytes._ResponseBody;

namespace Encode.Bytes
{
    public partial class BytesClient
    {
        public BytesClient() : this(new Uri("http://localhost:3000"), new BytesClientOptions()) => throw null;

        public BytesClient(Uri endpoint, BytesClientOptions options) => throw null;

        public ClientPipeline Pipeline => throw null;

        public virtual Query GetQueryClient() => throw null;

        public virtual Property GetPropertyClient() => throw null;

        public virtual Header GetHeaderClient() => throw null;

        public virtual RequestBody GetRequestBodyClient() => throw null;

        public virtual ResponseBody GetResponseBodyClient() => throw null;
    }
}
