using System.Threading;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample
{
    [CodeGenSuppress("GetData", typeof(int), typeof(string), typeof(CancellationToken))]
    [CodeGenSuppress("GetDataAsync", typeof(int), typeof(string), typeof(CancellationToken))]
    public partial class TestClient
    {
    }
}
