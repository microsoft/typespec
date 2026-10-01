using System.ClientModel;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public virtual ClientResult GetIpAddress() => default!;
        public virtual Task<ClientResult> GetDbStatusAsync() => default!;
        public virtual ClientResult GetOsProfile() => default!;
        public virtual ClientResult GetIpv4Configuration() => default!;
        public virtual ClientResult GetIpv6Configuration() => default!;
        public virtual ClientResult GetIpAddresses() => default!;
        public virtual ClientResult GetIpUri() => default!;
        public virtual ClientResult GetDbUrl() => default!;
        public virtual Task<ClientResult> GetOsUrlAsync() => default!;
        private ClientResult GetIpPrivate() => default!;
        private Task<ClientResult> GetDbPrivateAsync() => default!;
        internal ClientResult GetIpInternal() => default!;
        internal Task<ClientResult> GetDbInternalAsync() => default!;
        private protected ClientResult GetIpPrivateProtected() => default!;
        private protected Task<ClientResult> GetDbPrivateProtectedAsync() => default!;
        protected ClientResult GetIpProtected() => default!;
        protected Task<ClientResult> GetDbProtectedAsync() => default!;
        protected internal ClientResult GetIpProtectedInternal() => default!;
        protected internal Task<ClientResult> GetDbProtectedInternalAsync() => default!;
        private ClientResult GetOsPrivateUri() => default!;
        internal Task<ClientResult> GetOsInternalUriAsync() => default!;
    }
}
