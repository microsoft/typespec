using Sample.Models;

namespace Sample.Namespace
{
    public static partial class SampleNamespaceModelFactory
    {
        public static BackupVaultSecuritySettings BackupVaultSecuritySettings(
            BackupVaultSoftDeleteSettings softDeleteSettings = default,
            BackupVaultImmutabilityState? immutabilityState = default,
            BackupVaultEncryptionSettings encryptionSettings = default)
        { }
    }
}

namespace Sample.Models
{
    public partial class BackupVaultSecuritySettings
    { }

    public partial class BackupVaultSoftDeleteSettings
    { }

    public partial class BackupVaultEncryptionSettings
    { }

    public enum BackupVaultImmutabilityState
    {
        Unlocked
    }
}
