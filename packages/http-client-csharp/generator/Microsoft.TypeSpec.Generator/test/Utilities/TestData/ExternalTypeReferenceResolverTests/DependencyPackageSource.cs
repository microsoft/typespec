// Token-substituted template source used by ExternalTypeReferenceResolverTests to emit the
// *dependency* half of a two-package fake NuGet graph. Tokens replaced at compile time by the
// CreateFakeNuGetPackage helper:
//   $PACKAGE$  -> the package / namespace name (e.g. "Test.Dependency.Base")
//   $VERSION$  -> the assembly version embedded as an AssemblyVersionAttribute
//
// This file is excluded from compilation by the test project (see the
// `<Compile Remove="**\TestData\**\*.cs" />` rule in the .csproj).

using System.Reflection;

[assembly: AssemblyVersion("$VERSION$")]

namespace $PACKAGE$
{
    public class DependencyBaseType { }
}
