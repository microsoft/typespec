// Token-substituted template source used by ExternalTypeReferenceResolverTests
// to emit fake NuGet assemblies on disk. Tokens replaced at compile time by the
// CreateFakeNuGetPackage helper:
//   $PACKAGE$  -> the package / namespace name (e.g. "Test.External.Loadable")
//   $VERSION$  -> the assembly version embedded as an AssemblyVersionAttribute
//                 (3-part dotted version, e.g. "1.2.3")
//
// This file is excluded from compilation by the test project (see the
// `<Compile Remove="**\TestData\**\*.cs" />` rule in the .csproj).

using System.Reflection;

[assembly: AssemblyVersion("$VERSION$")]

namespace $PACKAGE$
{
    public class LoadableType { }
    public class SomeType { }
    public class RefType { }
    public class PreWalkType { }
    public class Placeholder { }
}
