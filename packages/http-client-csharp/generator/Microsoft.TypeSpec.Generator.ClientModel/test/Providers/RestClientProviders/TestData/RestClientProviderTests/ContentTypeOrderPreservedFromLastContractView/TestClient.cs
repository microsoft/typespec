#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        // This represents a previous contract where contentType appears before body (content)
        public virtual Task<ClientResult> UpdateSkillDefaultVersionAsync(string skillId, string contentType, BinaryContent content, RequestOptions options = null) { return null; }
        public virtual ClientResult UpdateSkillDefaultVersion(string skillId, string contentType, BinaryContent content, RequestOptions options = null) { return null; }
    }
}
