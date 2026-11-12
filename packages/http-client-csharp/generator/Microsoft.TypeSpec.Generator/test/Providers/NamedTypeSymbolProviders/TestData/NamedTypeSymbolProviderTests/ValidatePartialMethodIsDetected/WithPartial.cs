namespace Sample
{
    public partial class WithPartial
    {
        public partial void DoIt(int value);

        public void NonPartial(int value) { }
    }
}
