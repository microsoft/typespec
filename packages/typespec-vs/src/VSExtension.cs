using Microsoft.VisualStudio.Extensibility;

namespace Microsoft.TypeSpec.VisualStudio;

[VisualStudioContribution]
public sealed class TypeSpecExtension : Extension
{
    public override ExtensionConfiguration ExtensionConfiguration => new()
    {
        Metadata = new(
            id: "typespec.typespecvs",
            version: ExtensionAssemblyVersion,
            publisherName: "typespec",
            displayName: "TypeSpec for Visual Studio",
            description: "TypeSpec language support for Visual Studio")
        {
            InstallationTargetVersion = "[17.14,)",
            MoreInfo = "https://github.com/microsoft/typespec",
            License = "LICENSE",
            Icon = "Icons/logo.png",
            Preview = true,
        },
    };
}
