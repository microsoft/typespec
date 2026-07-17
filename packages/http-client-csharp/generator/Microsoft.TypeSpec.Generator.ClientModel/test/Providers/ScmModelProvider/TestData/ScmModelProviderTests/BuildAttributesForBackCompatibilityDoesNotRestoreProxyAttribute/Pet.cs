using System.ComponentModel;
using System.ClientModel.Primitives;

namespace Sample.Models
{
    [PersistableModelProxy(typeof(object))]
    [Description("bc")]
    public partial class Pet
    {
    }
}
