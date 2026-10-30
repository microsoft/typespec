// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Operations;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        [Test]
        public async Task TypeOnlyExpressionContextsUseStructuralNamesWithoutChangingOperations()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System; namespace Sample { public class Clock {");
                writer.WriteLine($"public object Create() => new {typeof(Exception)}();");
                writer.WriteLine($"public Type Kind() => typeof({typeof(Exception)});");
                writer.WriteLine($"public object Zero() => default({typeof(Exception)});");
                writer.WriteLine($"public object Array() => new {typeof(Exception)}[1];");
                writer.WriteLine($"public object Cast(object value) => ({typeof(Exception)})(value);");
                writer.WriteLine($"public void Catch() {{ try {{ throw new Exception(); }} catch ({typeof(Exception)} error) {{ Console.WriteLine(error); }} }}");
                writer.WriteRawLine("} }");
            });
            var output = await Reduce(code);
            var tree = CSharpSyntaxTree.ParseText(code.Content);
            var model = CSharpCompilation.Create("TypeContextBinding", new[] { tree }, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary)).GetSemanticModel(tree);
            var creationType = tree.GetRoot().DescendantNodes().OfType<ObjectCreationExpressionSyntax>().First().Type;
            Assert.That(model.GetSymbolInfo(creationType).Symbol, Is.InstanceOf<INamedTypeSymbol>(), "Creation names bind canonically through SymbolInfo; TypeInfo can be empty");
            StringAssert.DoesNotContain("global::System.Exception", output);
            foreach (var syntax in new[] { "new Exception()", "typeof(Exception)", "default(Exception)", "new Exception[1]", "(Exception)(value)", "catch (Exception error)" })
            {
                StringAssert.Contains(syntax, output);
            }

            AssertOperationBindings(code.Content, output);
        }

        [Test]
        public async Task BaseListAndMemberDeclarationDoNotShareDifferentLookupPositions()
        {
            var target = new CSharpType("Base", "N", false, false, null, System.Array.Empty<CSharpType>(), true, false);
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using N; namespace N { public class Base {} } namespace Sample {");
                writer.WriteLine($"public class Clock : {target} {{");
                writer.WriteRawLine("public class Base {}");
                writer.WriteLine($"public {target} Value => default;");
                writer.WriteRawLine("} }");
            });
            var output = await Reduce(code);
            StringAssert.DoesNotContain("global::N.Base", output);
            StringAssert.Contains("N.Base Value", output);
            AssertOperationBindings(code.Content, output);
        }

        [Test]
        public async Task ConstraintTypeNamesPreserveGenericParameterCaptureGuards()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System; namespace Sample { public class Clock {");
                writer.WriteLine($"public void M<Exception, T>() where T : {typeof(Exception)} {{ }}");
                writer.WriteLine($"public void Other<T>() where T : {typeof(Exception)} {{ }}");
                writer.WriteRawLine("} }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("where T : System.Exception", output);
            StringAssert.Contains("where T : Exception", output);
            StringAssert.DoesNotContain("global::System.Exception", output);
            AssertOperationBindings(code.Content, output);
        }

        [Test]
        public async Task StableConditionalDocumentReducesOnlyActiveSyntaxAndPreservesEveryConfiguration()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System; namespace Sample { public class Clock {");
                writer.WriteLine($"public {typeof(DateTimeOffset)} Timestamp => default;");
                writer.WriteRawLine("public object M() {");
                writer.WriteRawLine("#if NET8_0_OR_GREATER");
                writer.WriteLine($"{typeof(DateTimeOffset)} inactive = default;");
                writer.WriteRawLine("#else");
                writer.WriteLine($"{typeof(DateTimeOffset)} boundary = default;");
                writer.WriteLine($"{typeof(DateTimeOffset)} active = default;");
                writer.WriteRawLine("#endif");
                writer.WriteLine($"return typeof({typeof(DateTimeOffset)});");
                writer.WriteRawLine("} } }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("DateTimeOffset Timestamp", output);
            StringAssert.DoesNotContain("global::System.DateTimeOffset Timestamp", output);
            StringAssert.Contains("global::System.DateTimeOffset inactive", output);
            StringAssert.Contains("global::System.DateTimeOffset boundary", output, "The directive-bearing occurrence keeps the existing trivia guard");
            StringAssert.Contains("DateTimeOffset active", output);
            StringAssert.DoesNotContain("global::System.DateTimeOffset active", output);
            static string[] DisabledText(string source) => CSharpSyntaxTree.ParseText(source).GetRoot().DescendantTrivia()
                .Where(static trivia => trivia.IsKind(SyntaxKind.DisabledTextTrivia)).Select(static trivia => trivia.ToFullString()).ToArray();
            Assert.That(DisabledText(output), Is.EqualTo(DisabledText(code.Content)), "Inactive text must be byte-identical");
            foreach (var options in new[] { new CSharpParseOptions(), new CSharpParseOptions().WithPreprocessorSymbols("NET8_0_OR_GREATER"), new CSharpParseOptions().WithPreprocessorSymbols("NET8_0_OR_GREATER", "NET9_0_OR_GREATER") })
            {
                AssertOperationBindings(code.Content, output, options);
            }
        }

        [Test]
        public async Task ConditionalGenericLocalFunctionsConservativelyKeepTheDocumentQualified()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System; namespace Sample { public class Clock { public object M() {");
                writer.WriteRawLine("#if NET8_0_OR_GREATER");
                writer.WriteLine($"object F() => typeof({typeof(DateTimeOffset)});");
                writer.WriteRawLine("#else");
                writer.WriteLine($"object F<DateTimeOffset>() => typeof({typeof(DateTimeOffset)});");
                writer.WriteRawLine("#endif");
                writer.WriteLine($"return new {typeof(Exception)}();");
                writer.WriteRawLine("} } }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("new global::System.Exception()", output);
            Assert.AreEqual(2, output.Split("typeof(global::System.DateTimeOffset)").Length - 1);
            foreach (var options in new[] { new CSharpParseOptions(), new CSharpParseOptions().WithPreprocessorSymbols("NET8_0_OR_GREATER") })
            {
                AssertOperationBindings(code.Content, output, options);
            }
        }

        [Test]
        public async Task ConditionalGenericWrapperCannotChangeAnActiveSitesTypeParameterScope()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System; namespace Sample { public class Clock { public void M() {");
                writer.WriteRawLine("#if NET6_0_OR_GREATER\nvoid Local<DateTimeOffset>() {\n#endif");
                writer.WriteLine($"{typeof(DateTimeOffset)} value = default;");
                writer.WriteRawLine("#if NET6_0_OR_GREATER\n}\n#endif\n} } }");
            });
            var tree = CSharpSyntaxTree.ParseText(code.Content);
            var compilation = CSharpCompilation.Create("ConditionalWrapper", new[] { tree }, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.True(new ProviderConditionalSyntax(compilation).TryGetRoots(tree.GetRoot(), out _), "Existing body/header proof alone admits the wrapper");
            var output = await Reduce(code);
            StringAssert.Contains("global::System.DateTimeOffset value", output);
            var net6 = new CSharpParseOptions().WithPreprocessorSymbols("NET6_0_OR_GREATER");
            AssertOperationBindings(code.Content, output);
            AssertOperationBindings(code.Content, output, net6);
            var unsafeShortening = code.Content.Replace("global::System.DateTimeOffset value", "DateTimeOffset value");
            AssertOperationBindings(code.Content, unsafeShortening);
            Assert.Throws<AssertionException>(() => AssertOperationBindings(code.Content, unsafeShortening, net6));
        }

        [Test]
        public async Task ClassConstraintAndBodyHaveDistinctLookupFactsAndDecisions()
        {
            var target = new CSharpType("Base", "N", false, false, null, System.Array.Empty<CSharpType>(), true, false);
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using N; namespace N { public class Base {} } namespace Sample {");
                writer.WriteLine($"public class Clock<T> where T : {target} {{");
                writer.WriteRawLine("public class Base {}");
                writer.WriteLine($"public {target} Value => default;");
                writer.WriteRawLine("} }");
            });
            var output = await Reduce(code);
            StringAssert.DoesNotContain("global::N.Base", output);
            StringAssert.Contains("N.Base Value", output);
            AssertOperationBindings(code.Content, output);
        }

        [Test]
        public async Task TypeOnlyLookupIgnoresValuesButRespectsLocalFunctionTypeParametersAndRestoresScope()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System; namespace Sample { public class Clock { public object M() { int Exception = 0;");
                writer.WriteLine($"{typeof(Exception)} seed = default;");
                writer.WriteLine($"object F<Exception>() => new {typeof(Exception)}();");
                writer.WriteLine($"return new {typeof(Exception)}();");
                writer.WriteRawLine("} } }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("Exception seed", output);
            StringAssert.Contains("F<Exception>() => new System.Exception()", output);
            StringAssert.Contains("return new Exception()", output);
            AssertOperationBindings(code.Content, output);
        }

        [Test]
        public async Task ProtectedCastCacheHitDoesNotPermitAnUnprotectedCast()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System; namespace Sample { public class Clock { public object M(object value) {");
                writer.WriteLine($"{typeof(Exception)} seed = default;");
                writer.WriteLine($"object protectedValue = ({typeof(Exception)})(value);");
                writer.WriteLine($"return ({typeof(Exception)})value;");
                writer.WriteRawLine("} } }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("Exception seed", output);
            StringAssert.Contains("(Exception)(value)", output);
            StringAssert.Contains("(global::System.Exception)value", output);
            AssertOperationBindings(code.Content, output);
        }

        [Test]
        public async Task AttributeArgumentsCannotUseAnOrdinaryTypeofDecision()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System; namespace Sample { public sealed class HolderAttribute : Attribute { public HolderAttribute(Type type) {} }");
                writer.WriteLine($"[Holder(typeof({typeof(Exception)}))] public class Clock {{");
                writer.WriteLine($"public Type M() => typeof({typeof(Exception)});");
                writer.WriteRawLine("} }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("Holder(typeof(global::System.Exception))", output);
            StringAssert.Contains("typeof(Exception)", output);
            AssertOperationBindings(code.Content, output);
        }

        [TestCase(0)]
        [TestCase(1)]
        [TestCase(2)]
        [TestCase(3)]
        [TestCase(4)]
        [TestCase(5)]
        [TestCase(6)]
        [TestCase(7)]
        public async Task CallerExpressionTextIsPreservedAfterADeclarationDecision(int kind)
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System; using System.Runtime.CompilerServices; namespace Sample { public class Clock { public object M(object value) {");
                writer.WriteLine($"{typeof(Exception)} seed = default;");
                switch (kind)
                {
                    case 0: writer.WriteLine($"return Capture(new {typeof(Exception)}());"); break;
                    case 1: writer.WriteLine($"return Capture(typeof({typeof(Exception)}));"); break;
                    case 2: writer.WriteLine($"return Capture(default({typeof(Exception)}));"); break;
                    case 3: writer.WriteLine($"return Capture(new {typeof(Exception)}[1]);"); break;
                    case 4: writer.WriteLine($"return Capture(({typeof(Exception)})(value));"); break;
                    case 5: writer.WriteLine($"return new Consumer(new {typeof(Exception)}());"); break;
                    case 6: writer.WriteLine($"return new {typeof(Exception)}().CaptureExtension();"); break;
                    default: writer.WriteLine($"return new {typeof(Exception)}()?.CaptureExtension();"); break;
                }
                writer.WriteRawLine("} private static string Capture(object value, [CallerArgumentExpression(\"value\")] string text = \"\") => text; }");
                writer.WriteRawLine("public class Consumer { public Consumer(object value, [CallerArgumentExpression(\"value\")] string text = \"\") {} }");
                writer.WriteRawLine("public static class Extensions { public static string CaptureExtension(this object value, [CallerArgumentExpression(\"value\")] string text = \"\") => text; } }");
            });
            var output = await Reduce(code);
            StringAssert.DoesNotContain("global::System.Exception seed", output);
            StringAssert.Contains("global::System.Exception", output, "Source-observable expression spelling must survive a warm method-region decision");
            AssertOperationBindings(code.Content, output);
        }

        [Test]
        public async Task ParameterAttributeCannotReuseTheMethodReturnTypesDecision()
        {
            var code = Recorded(writer =>
            {
                writer.WriteRawLine("using System; namespace Sample { public sealed class HolderAttribute : Attribute { public HolderAttribute(Type value) {} } public class Clock {");
                writer.WriteLine($"public {typeof(Exception)} M([Holder(typeof({typeof(Exception)}))] int value) => new {typeof(Exception)}();");
                writer.WriteRawLine("} }");
            });
            var output = await Reduce(code);
            StringAssert.Contains("Exception M(", output);
            StringAssert.DoesNotContain("global::System.Exception M(", output);
            StringAssert.Contains("Holder(typeof(global::System.Exception))", output);
            StringAssert.Contains("new Exception()", output);
            AssertOperationBindings(code.Content, output);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void OperationOracleRejectsChangedCompilerSuppliedCallerExpression(bool constructor)
        {
            const string helpers = "using System; using System.Runtime.CompilerServices; class Consumer { public Consumer(object value, [CallerArgumentExpression(\"value\")] string text = \"\") {} } class C { static string Capture(object value, [CallerArgumentExpression(\"value\")] string text = \"\") => text; public object M() => $CALL$; }";
            var expression = constructor ? "new Consumer(new global::System.Exception())" : "Capture(new global::System.Exception())";
            var before = helpers.Replace("$CALL$", expression);
            Assert.Throws<AssertionException>(() => AssertOperationBindings(before, before.Replace("global::System.Exception", "Exception")));
        }

        [TestCase("new string[1]", "new object[1]")]
        [TestCase("typeof(string)", "typeof(object)")]
        [TestCase("new Exception(\"value\")", "new Exception(\"value\", null)")]
        [TestCase("default(string)", "default(object)")]
        public void OperationOracleRejectsChangedTypeOrConstructor(string before, string after)
        {
            const string template = "using System; public class C { public object M() => $VALUE$; }";
            Assert.Throws<AssertionException>(() => AssertOperationBindings(template.Replace("$VALUE$", before), template.Replace("$VALUE$", after)));
        }

        private static void AssertOperationBindings(string before, string after, CSharpParseOptions? options = null)
        {
            static string? MethodIdentity(IMethodSymbol? method) => method == null ? null :
                method.OriginalDefinition.GetDocumentationCommentId() + ":" + StructuralTypeNameRuleOracleTests.TypeIdentity(method.ContainingType) + ":" +
                string.Join(",", method.TypeArguments.Select(StructuralTypeNameRuleOracleTests.TypeIdentity));
            static string ArgumentsIdentity(IEnumerable<IArgumentOperation> arguments) => string.Join("|", arguments.Select(static argument =>
                argument.Parameter?.Ordinal + ":" + argument.ArgumentKind + ":" + argument.IsImplicit + ":" +
                (argument.Value.ConstantValue.HasValue ? argument.Value.ConstantValue.Value?.GetType().FullName + ":" + argument.Value.ConstantValue.Value : "<nonconstant>")));
            string[] Snapshot(string source)
            {
                var tree = CSharpSyntaxTree.ParseText(source, options);
                var compilation = CSharpCompilation.Create("StructuralOperationOracle", new[] { tree }, References,
                    new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
                Assert.That(compilation.GetDiagnostics().Where(static d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
                var model = compilation.GetSemanticModel(tree);
                var result = new List<string>();
                foreach (var node in tree.GetRoot().DescendantNodes())
                {
                    var value = node switch
                    {
                        ObjectCreationExpressionSyntax creation => model.GetOperation(creation) is IObjectCreationOperation created ? MethodIdentity(created.Constructor) + ":" + ArgumentsIdentity(created.Arguments) : null,
                        ImplicitObjectCreationExpressionSyntax creation => model.GetOperation(creation) is IObjectCreationOperation implicitCreation ? MethodIdentity(implicitCreation.Constructor) + ":" + ArgumentsIdentity(implicitCreation.Arguments) : null,
                        ConstructorInitializerSyntax initializer => model.GetOperation(initializer) is IInvocationOperation initialized ? MethodIdentity(initialized.TargetMethod) + ":" + ArgumentsIdentity(initialized.Arguments) : null,
                        TypeOfExpressionSyntax typeOf => StructuralTypeNameRuleOracleTests.TypeIdentity((model.GetOperation(typeOf) as ITypeOfOperation)?.TypeOperand),
                        DefaultExpressionSyntax zero => StructuralTypeNameRuleOracleTests.TypeIdentity((model.GetOperation(zero) as IDefaultValueOperation)?.Type),
                        ArrayCreationExpressionSyntax array => StructuralTypeNameRuleOracleTests.TypeIdentity((model.GetOperation(array) as IArrayCreationOperation)?.Type),
                        CastExpressionSyntax cast => StructuralTypeNameRuleOracleTests.TypeIdentity((model.GetOperation(cast) as IConversionOperation)?.Type) + ":" + MethodIdentity((model.GetOperation(cast) as IConversionOperation)?.OperatorMethod),
                        CatchDeclarationSyntax caught => StructuralTypeNameRuleOracleTests.TypeIdentity(model.GetTypeInfo(caught.Type).Type),
                        SimpleBaseTypeSyntax @base => StructuralTypeNameRuleOracleTests.TypeIdentity(model.GetTypeInfo(@base.Type).Type),
                        TypeConstraintSyntax constraint => StructuralTypeNameRuleOracleTests.TypeIdentity(model.GetTypeInfo(constraint.Type).Type),
                        VariableDeclaratorSyntax variable => model.GetDeclaredSymbol(variable) is ILocalSymbol local ? StructuralTypeNameRuleOracleTests.TypeIdentity(local.Type) : null,
                        InvocationExpressionSyntax invocation => model.GetOperation(invocation) is IInvocationOperation operation ? MethodIdentity(operation.TargetMethod) + ":" + ArgumentsIdentity(operation.Arguments) : null,
                        _ => null
                    };
                    if (value != null)
                    {
                        result.Add(node.Kind() + ":" + value);
                    }
                }
                return result.ToArray();
            }
            Assert.That(Snapshot(after), Is.EqualTo(Snapshot(before)), "Types, constructors, conversions and enclosing calls must retain binding");
        }
    }
}
