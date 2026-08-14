using System.ClientModel;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        public static explicit operator MockInputModel(ClientResult result) => throw null;
    }
}
