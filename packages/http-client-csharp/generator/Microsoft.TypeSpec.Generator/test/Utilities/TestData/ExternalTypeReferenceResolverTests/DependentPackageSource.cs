// Token-substituted template source used by ExternalTypeReferenceResolverTests to emit the
// *dependent* half of a two-package fake NuGet graph. The declared type derives from a type that
// lives in a different package, which is the shape that previously defeated resolution: loading the
// assembly succeeds, but Assembly.GetType returns null because the base type's assembly cannot be
// found by the default AssemblyLoadContext.
//
// Tokens replaced at compile time by the CreateFakeNuGetPackage helper:
//   $PACKAGE$     -> the package / namespace name (e.g. "Test.Dependent.Leaf")
//   $VERSION$     -> the assembly version embedded as an AssemblyVersionAttribute
//   $BASEPACKAGE$ -> the namespace of the dependency package declaring DependencyBaseType
//
// This file is excluded from compilation by the test project (see the
// `<Compile Remove="**\TestData\**\*.cs" />` rule in the .csproj).

using System.Reflection;

[assembly: AssemblyVersion("$VERSION$")]

namespace $PACKAGE$
{
    public class DerivedFromDependencyType : $BASEPACKAGE$.DependencyBaseType { }
}
