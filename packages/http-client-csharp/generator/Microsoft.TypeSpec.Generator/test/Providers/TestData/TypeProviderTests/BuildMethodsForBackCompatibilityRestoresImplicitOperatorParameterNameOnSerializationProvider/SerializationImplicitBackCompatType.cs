namespace Test
{
    public partial class SerializationImplicitBackCompatType
    {
        public static implicit operator string(SerializationImplicitBackCompatType published) => null;
    }
}
