namespace Sample
{
    public abstract class WithAbstract
    {
        public abstract int AbstractMethod(int value);

        public virtual int VirtualMethod(int value) => value;
    }
}
