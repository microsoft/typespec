// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator.Providers
{
    internal sealed partial class PreparedFieldTypes
    {
        // The accepted unused-default-local + return-call shape. Reuse the
        // existing whole-group/header/docs/suppression proofs; this is not a
        // second generated-language grammar or a general lexical binder.
        internal sealed class PreparedTypeOfFiniteEmissionShape
        {
            private readonly PreparedGeneratedMethodGroup _group;
            private readonly IReadOnlyList<TypeProvider> _owners;
            private readonly ImmutableArray<TypeProvider> _ownerSnapshot;
            private readonly CodeModelGenerator _generator;
            private readonly Configuration _configuration;
            private readonly string _license;
            private readonly bool _disableXmlDocs;
            private readonly bool _enabled;
            private readonly bool _disableReduction;
            private readonly string _outputDirectory;
            private readonly MethodProvider _method;
            private readonly PreparedUnusedDefaultLocalCallBlock.ClosedArgumentKind _argumentKind;
            private int _stale;
            internal PreparedSourceFile File { get; }
            internal PreparedSourceOccurrence ExpressionRoot { get; }
            internal PreparedSourceOccurrence DeclarationOccurrence { get; }
            internal PreparedSourceOccurrence AssignmentOccurrence { get; }
            internal DeclarationExpression Declaration { get; }
            internal TypeOfExpression? Operand { get; }
            internal InvokeMethodExpression Call { get; }
            internal ImmutableHashSet<string> KnownNamespaceImports { get; }

            private PreparedTypeOfFiniteEmissionShape(PreparedSourceFile file, PreparedGeneratedMethodGroup group,
                IReadOnlyList<TypeProvider> owners, ImmutableArray<TypeProvider> ownerSnapshot, MethodProvider method,
                PreparedSourceOccurrence body, PreparedSourceOccurrence declaration, PreparedSourceOccurrence assignment,
                TypeOfExpression? operand, PreparedUnusedDefaultLocalCallBlock.ParsedBlock parsed)
            {
                File = file; _group = group; _owners = owners; _ownerSnapshot = ownerSnapshot; _method = method;
                ExpressionRoot = body; DeclarationOccurrence = declaration; AssignmentOccurrence = assignment;
                Declaration = parsed.Declaration; Operand = operand; Call = parsed.Call; _argumentKind = parsed.ArgumentKind;
                _generator = CodeModelGenerator.Instance; _configuration = _generator.Configuration;
                _license = _generator.LicenseHeader; _disableXmlDocs = _configuration.DisableXmlDocs;
                _enabled = _configuration.EnablePreEmissionSimplification; _disableReduction = _configuration.DisableRoslynReduce;
                _outputDirectory = _configuration.OutputDirectory;
                // The default-local and native argument formatters both register
                // System even when their spelling stays qualified. Group imports
                // conservatively cover signatures, docs and observer attributes.
                KnownNamespaceImports = group.ImportNamespaces.Append("System")
                    .Where(ns => ns != file.FileOwner.CachedType!.Namespace)
                    .ToImmutableHashSet(StringComparer.Ordinal);
            }

            internal static PreparedTypeOfFiniteEmissionShape? TryCapture(PreparedSourceFile file,
                IReadOnlyList<TypeProvider> owners, CSharpCompilation compilation, PreparedSourceOccurrence site)
            {
                if (!ReferenceEquals(file.Compilation, compilation) || !ContractCollections.TryCopy(owners, out var roots) ||
                    roots.Length != 1 || !ReferenceEquals(roots[0], file.FileOwner) ||
                    !ContractCollections.TryCopy(file.FileOwner.CachedMethods, out var methods)) { return null; }
                var callerRoot = file.Roots.SingleOrDefault(root => root.Id.RootRole == site.Id.RootRole &&
                    root.Id.RootIndex == site.Id.RootIndex && root.Id.MemberPath == site.Id.MemberPath);
                if (callerRoot?.Producer is not MethodProvider caller || !methods.Any(method => ReferenceEquals(method, caller)) ||
                    PreparedUnusedDefaultLocalCallBlock.TryParse(caller) is not { } parsed ||
                    parsed.ArgumentKind == PreparedUnusedDefaultLocalCallBlock.ClosedArgumentKind.ExplicitGeneric)
                { return null; }
                var call = parsed.Call;
                if (!ContractCollections.TryCopy(call.Arguments, out var arguments) || arguments.Length != 1 ||
                    !(arguments[0] is TypeOfExpression { } typeOf && typeOf.GetType() == typeof(TypeOfExpression) ||
                        PreparedUnusedDefaultLocalCallBlock.IsOriginalConstructionArgument(arguments[0])) ||
                    call.TypeArguments is not null && (!ContractCollections.TryCopy(call.TypeArguments, out var types) || !types.IsEmpty))
                { return null; }
                var nodes = callerRoot.DescendantsAndSelf().ToArray();
                var bodies = nodes.Where(node => ReferenceEquals(node.Producer, parsed.Block)).ToArray();
                var declarations = nodes.Where(node => ReferenceEquals(node.Producer, parsed.Declaration)).ToArray();
                var assignments = nodes.Where(node => ReferenceEquals(node.Producer, parsed.Assignment)).ToArray();
                if (bodies.Length != 1 || declarations.Length != 1 || assignments.Length != 1 ||
                    bodies[0].DescendantsAndSelf().Any(node => node.IsOpaque) ||
                    PreparedGeneratedMethodGroup.TryCapture(file.FileOwner, compilation) is not { } group ||
                    !PreparedCallImportScope.HasPureFormattedTypes(group.ImportTypes))
                { return null; }
                var sourceOwner = CaptureSourceOwnerScope(compilation, file.FileOwner.CachedType!.Namespace, file.FileOwner.CachedType.Name);
                if (!sourceOwner.Supported || sourceOwner.Exists) { return null; }
                var result = new PreparedTypeOfFiniteEmissionShape(file, group, owners, roots, caller, bodies[0],
                    declarations[0], assignments[0], arguments[0] as TypeOfExpression, parsed);
                return result.IsCurrent ? result : null;
            }

            internal bool IsCurrent
            {
                get
                {
                    if (System.Threading.Volatile.Read(ref _stale) != 0) { return false; }
                    if (ReferenceEquals(CodeModelGenerator.Instance, _generator) && ReferenceEquals(_generator.Configuration, _configuration) &&
                        _generator.LicenseHeader == _license && _configuration.DisableXmlDocs == _disableXmlDocs &&
                        _configuration.EnablePreEmissionSimplification == _enabled && _configuration.DisableRoslynReduce == _disableReduction &&
                        _configuration.OutputDirectory == _outputDirectory && ContractCollections.SameReferences(_owners, _ownerSnapshot) &&
                        PreparedUnusedDefaultLocalCallBlock.TryParse(_method) is { } parsed &&
                        ReferenceEquals(parsed.Block, ExpressionRoot.Producer) && ReferenceEquals(parsed.Declaration, Declaration) &&
                        ReferenceEquals(parsed.Assignment, AssignmentOccurrence.Producer) && ReferenceEquals(parsed.Call, Call) &&
                        parsed.ArgumentKind == _argumentKind &&
                        PreparedCallImportScope.HasPureFormattedTypes(_group.ImportTypes) && _group.IsCurrent && File.IsCurrent())
                    { return true; }
                    System.Threading.Interlocked.Exchange(ref _stale, 1);
                    return false;
                }
            }

            internal bool IsKnownDefaultBarrier(PreparedSourceObservations.PreparedCaptureBarrier barrier) =>
                barrier.Kind == PreparedSourceObservations.PreparedCaptureBarrierKind.ImplicitOperation && barrier.RegionRoot == barrier.Origin &&
                (barrier.Origin == DeclarationOccurrence.Id || barrier.Origin == AssignmentOccurrence.Id);
        }
    }
}
