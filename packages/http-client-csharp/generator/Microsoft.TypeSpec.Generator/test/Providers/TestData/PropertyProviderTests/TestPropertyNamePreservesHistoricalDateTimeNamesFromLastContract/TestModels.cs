namespace Test
{
    public class TestModel
    {
        public System.DateTimeOffset EndOn { get; set; }
        public System.DateTimeOffset ExpireOn { get; set; }
        public System.DateTimeOffset AccessTierChangeOn { get; set; }
        public System.DateTimeOffset LastSyncTimestamp { get; set; }
    }

    public class CanonicalModel
    {
        public System.DateTimeOffset StartsOn { get; set; }
    }

    public class InternalLegacyModel
    {
        internal System.DateTimeOffset StartOn { get; set; }
    }
}
