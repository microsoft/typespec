// <auto-generated/>

#nullable disable

using System.Threading;

namespace Sample
{
    /// <summary></summary>
    public partial class TestClient
    {
        /// <summary> Initializes a new instance of Animal. </summary>
        public virtual global::Sample.Animal GetAnimalClient()
        {
            return (global::System.Threading.Volatile.Read(ref _cachedAnimal) ?? (global::System.Threading.Interlocked.CompareExchange(ref _cachedAnimal, new global::Sample.Animal(), null) ?? _cachedAnimal));
        }
    }
}
