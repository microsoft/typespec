// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    /// <summary>A bounded observation adapter, not a visitor, binder or emission/discovery pass.</summary>
    internal sealed class StructuredSourceShape
    {
        internal ImmutableArray<SourceChild> Children { get; private set; } = [];
        internal bool Opaque { get; private set; }
        internal string? UnavailableReason { get; private set; }
        internal bool IntrinsicTokens { get; private set; } = true;
        internal bool IntrinsicLineBreaks { get; private set; }
        internal bool HasDirectives { get; private set; }
        internal bool IntrinsicLayoutKnown { get; private set; } = true;
        private readonly List<object?> _values = [];
        private readonly List<object?> _references = [];
        private readonly List<CSharpType> _types = [];
        private readonly List<CodeWriterDeclaration> _declarations = [];
        private readonly List<AttributeSnapshot> _metadataAttributes = [];
        private ImmutableArray<DeclaredTypeSnapshot> _typeSnapshots;
        private ImmutableArray<(CodeWriterDeclaration Declaration, long Revision, string Name)> _declarationSnapshots;
        private readonly List<SourceChild> _children = [];

        internal static StructuredSourceShape Capture(object node, bool disableXmlDocs)
        {
            var s = new StructuredSourceShape();
            // Every access below is statically typed, nonvirtual, and producer-owned. Nonsealed IR
            // node subclasses are accepted only at exact audited runtime types, never by reflection.
            if (node is ValueExpression expression) { s.Value(expression.SourceRevision); }
            if (node is MethodBodyStatement statement) { s.Value(statement.SourceRevision); }
            switch (node)
            {
                case InvokeMethodExpression n:
                    s.Value(n.DeclarationRevision); s.Value(n.MethodName); s.Ref(n.MethodSignature); s.Ref(n.MethodProviderIntent);
                    s.Ref(n.DelegateParameterIntent); s.Ref(n.DeclaredContractIntent); s.Value(n.IsReducedExtensionIntent);
                    s.Value(n.CallAsAsync); s.Value(n.AddConfigureAwaitFalse); s.Type(n.ExtensionType);
                    if (n.MethodSignature is { } signature) { s.SignatureMetadata(signature); }
                    if (n.MethodProviderIntent is { } intendedMethod)
                    { s.Value(intendedMethod.DeclarationRevision); s.SignatureMetadata(intendedMethod.Signature); }
                    if (n.DelegateParameterIntent is { } parameter) { s.Value(parameter.DeclarationRevision); }
                    if (n.InstanceReference is { } receiver)
                    {
                        // The singleton Static() receiver writes nothing and is skipped by Invoke.Write.
                        if (receiver is not TypeReferenceExpression { IsStaticPlaceholder: true }) { s.Child("receiver", receiver); }
                        else { s.Ref(receiver); }
                    }
                    s.Types(n.TypeArguments); s.Nodes("argument", n.Arguments); s.IntrinsicTokens = false; s.IntrinsicLayoutKnown = false; break;
                case NewInstanceExpression n:
                    s.Type(n.Type); s.Ref(n.ConstructorIntent); s.Ref(n.ConstructorProviderIntent);
                    if (n.ConstructorIntent is { } ctor) { s.SignatureMetadata(ctor); s.Type(ctor.Type); }
                    if (n.ConstructorProviderIntent is { } intendedConstructor)
                    { s.Value(intendedConstructor.DeclarationRevision); s.SignatureMetadata(intendedConstructor.Signature); s.Type(intendedConstructor.Signature.Type); }
                    s.Nodes("argument", n.Parameters); s.Child("initializer", n.InitExpression);
                    s.IntrinsicLayoutKnown = false; break; // actual wrapping/initializer edits still need a change contract
                case FuncExpression n:
                    if (ContractCollections.TryCopy(n.Parameters, out var parameters))
                    {
                        foreach (var p in parameters) { s.Declaration(p); }
                    }
                    else { s.Fail("Unowned lambda parameter list."); }
                    if (n.BlockBody is { } block) { s.Child("block-body", block); s.IntrinsicLineBreaks = true; }
                    else { s.Child("expression-body", n.Inner); }
                    break;
                case ArgumentExpression n:
                    s.Value(n.DeclarationRevision); s.Value(n.IsRef); s.Value(n.IsOut); s.Value(n.IsIn); s.Child("value", n.Expression); break;
                case PositionalParameterReferenceExpression n:
                    s.Value(n.ParameterName); if (!SimpleIdentifier(n.ParameterName)) { s.IntrinsicTokens = false; s.IntrinsicLayoutKnown = false; }
                    s.Ref(n.ReferencedParameter); s.Value(n.ReferencedParameter?.DeclarationRevision);
                    s.Child("value", n.ParameterValue); break;
                case KeywordExpression n:
                    s.Value(n.DeclarationRevision); s.Value(n.Keyword); s.Child("value", n.Expression);
                    s.IntrinsicTokens = n.Keyword is "null" or "default" or "this" or "base" or "true" or "false" or "return" or "throw" or "break" or "continue" or "_" or "checked";
                    s.IntrinsicLayoutKnown = s.IntrinsicTokens;
                    break;
                case LiteralExpression n:
                    if (n.Literal is null or string or char or bool or byte or sbyte or short or ushort or int or uint or long or ulong or float or double or decimal)
                    { s.Value(n.Literal); }
                    else { s.Ref(n.Literal); s.Fail("Opaque literal formatter/value."); }
                    break;
                case TypeReferenceExpression n: s.Type(n.Type); break;
                case TypeOfExpression n when n.GetType() == typeof(TypeOfExpression): s.Type(n.Type); break;
                case VariableExpression n when n.GetType() == typeof(VariableExpression): s.Type(n.Type); s.Declaration(n.Declaration); break;
                case MemberExpression n:
                    s.Child("receiver", n.Inner); s.Value(n.MemberName); s.Declaration(n.Declaration); s.IntrinsicTokens = false; s.IntrinsicLayoutKnown = false; break;
                case DeclarationExpression n:
                    s.Value(n.IsOut); s.Value(n.IsUsing); s.Value(n.IsConst); s.Child("variable", n.Variable); break;
                case AssignmentExpression n:
                    s.Value(n.UseNullCoalesce); s.Child("target", n.Variable); s.Child("value", n.Value); break;
                case BinaryOperatorExpression n:
                    s.Value(n.Operator); s.Value(n.AddParentheses); s.Child("left", n.Left); s.Child("right", n.Right); s.IntrinsicTokens = false; s.IntrinsicLayoutKnown = false; break;
                case UnaryOperatorExpression n:
                    s.Value(n.Operator); s.Value(n.OperandOnTheLeft); s.Child("operand", n.Operand); s.IntrinsicTokens = false; s.IntrinsicLayoutKnown = false; break;
                case CastExpression n: s.Type(n.Type); s.Child("value", n.Inner); break;
                case AsExpression n: s.Type(n.Type); s.Child("value", n.Inner); break;
                case NullConditionalExpression n: s.Child("value", n.Inner); break;
                case TernaryConditionalExpression n:
                    s.Child("condition", n.Condition); s.Child("consequent", n.Consequent); s.Child("alternative", n.Alternative); break;
                case IndexerExpression n:
                    s.Child("receiver", n.Inner); s.Child("index", n.Index); if (n.Elements is not null) { s.Nodes("element", n.Elements); } break;
                case NewArrayExpression n:
                    s.Type(n.Type); s.Value(n.IsStackAlloc);
                    if (n.Size is not null) { s.Child("size", n.Size); s.Ref(n.Items); }
                    else if (n.Items is { } items)
                    {
                        if (items.Elements is null) { s.Ref(items); }
                        else if (ContractCollections.TryCopy(items.Elements, out var elements))
                        { if (elements.Length > 0) { s.Child("initializer", items); } else { s.Ref(items); } }
                        else { s.Fail("Unowned array initializer elements."); }
                    }
                    break;
                case ArrayInitializerExpression n:
                    s.Value(n.IsInline); if (n.Elements is not null) { s.Nodes("element", n.Elements); }
                    s.IntrinsicLineBreaks = !n.IsInline && s._children.Count > 0; break;
                case DictionaryInitializerExpression n: s.Dictionary(n.Values); s.IntrinsicLineBreaks = s._children.Count > 0; break;
                case ObjectInitializerExpression n when n.GetType() == typeof(ObjectInitializerExpression):
                    s.Value(n.UseSingleLine); s.Dictionary(n.Values); s.IntrinsicLineBreaks = !n.UseSingleLine && s._children.Count > 0; break;
                case CollectionInitializerExpression n: s.Nodes("element", n.Items); break;
                case FormattableStringExpression n:
                    s.Value(n.Format); s.Nodes("hole", n.Arguments); s.IntrinsicTokens = false;
                    // Format is raw producer text. No attempt is made to parse it or infer trivia/directive safety.
                    s.IntrinsicLayoutKnown = false; break;
                case ScopedApi n when AttributeSnapshot.IsKnownWrapper(n) ||
                    n.GetType().IsGenericType && n.GetType().GetGenericTypeDefinition() == typeof(ScopedApi<>):
                    s.Value(n.DeclarationRevision); s.Type(n.Type); s.Child("value", n.Original); break;
                case DictionaryExpression n: s.Type(n.Type); s.Child("value", n.Original); break;
                case ListExpression n: s.Type(n.ElementType); s.Child("value", n.Original); break;
                case KeyValuePairExpression n: s.Type(n.KeyType); s.Type(n.ValueType); s.Child("value", n.Original); break;
                case IndexableExpression n when n.GetType() == typeof(IndexableExpression): s.Child("value", n.Original); break;
                case TupleExpression n when n.GetType() == typeof(TupleExpression): s.Nodes("element", n.ValueExpressions); break;
                case VariableTupleExpression n when n.GetType() == typeof(VariableTupleExpression):
                    s.Value(n.IsRef); s.Nodes("variable", n.Variables, false); break;
                case WhereExpression n: s.Type(n.Type); s.Nodes("constraint", n.Constraints); break;
                case SwitchExpression n: s.Child("match", n.MatchExpression); s.Nodes("case", n.Cases); s.IntrinsicLineBreaks = true; break;
                case SwitchCaseExpression n: s.Child("match", n.Case); s.Child("value", n.Expression); break;
                case SwitchCaseWhenExpression n: s.Child("match", n.Case); s.Child("condition", n.Condition); break;
                case TryExpression n: s.FlattenedBody(n.SourceBody); s.IntrinsicLineBreaks = true; break;
                case CatchExpression n: s.Child("exception", n.Exception); s.FlattenedBody(n.SourceBody); s.IntrinsicLineBreaks = true; break;
                case FinallyExpression n: s.Nodes("body", n.SourceBody); s.IntrinsicLineBreaks = true; break;
                case MethodBodyStatements n when n.GetType() == typeof(MethodBodyStatements): s.Nodes("statement", n.Statements); break;
                case ExpressionStatement n when n.GetType() == typeof(ExpressionStatement): s.Child("expression", n.Expression); s.IntrinsicLineBreaks = true; break;
                case YieldReturnStatement n when n.GetType() == typeof(YieldReturnStatement): s.Child("value", n.Value); s.IntrinsicLineBreaks = true; break;
                case YieldBreakStatement n when n.GetType() == typeof(YieldBreakStatement): s.IntrinsicLineBreaks = true; break;
                case ForEachStatement n:
                    s.Type(n.ItemType); s.Declaration(n.Item); s.Value(n.IsAsync); s.Child("collection", n.Enumerable);
                    s.Nodes("body", n.Body as IReadOnlyList<MethodBodyStatement>); s.IntrinsicLineBreaks = true; break;
                case ForStatement n:
                    s.Child("initializer", n.IndexExpression); s.Child("condition", n.Condition); s.Child("increment", n.IncrementExpression);
                    s.Nodes("body", n.Body); s.IntrinsicLineBreaks = true; break;
                case WhileStatement n when n.GetType() == typeof(WhileStatement):
                    s.Child("condition", n.Condition); s.Nodes("body", n.SourceBody); s.IntrinsicLineBreaks = true; break;
                case DoWhileStatement n when n.GetType() == typeof(DoWhileStatement):
                    s.Nodes("body", n.SourceBody); s.Child("condition", n.Condition); s.IntrinsicLineBreaks = true; break;
                case IfStatement n:
                    s.Value(n.Inline); s.Value(n.AddBraces); s.Child("condition", n.Condition); s.Nodes("body", n.SourceBody); s.IntrinsicLineBreaks = !n.Inline; break;
                case IfElseStatement n:
                    s.Child("if", n.If); s.Nodes("else-if", n.ElseIfs); s.Child("else", n.Else); s.IntrinsicLineBreaks = n.Else is not null; break;
                case IfElsePreprocessorStatement n:
                    s.Value(n.Condition); s.Child("if-variant", n.If); s.Child("else-variant", n.Else);
                    s.HasDirectives = true; s.IntrinsicLineBreaks = true; s.IntrinsicTokens = false; break;
                case UsingScopeStatement n:
                    s.Type(n.Type); s.Declaration(n.Variable); s.Child("resource", n.Value); s.Nodes("body", n.Body); s.IntrinsicLineBreaks = true; break;
                case TryCatchFinallyStatement n:
                    s.Child("try", n.Try); s.Nodes("catch", n.Catches); s.Child("finally", n.Finally); break;
                case SwitchStatement n:
                    s.Child("match", n.MatchExpression); s.Nodes("case", n.Cases); s.IntrinsicLineBreaks = true; break;
                case SwitchCaseStatement n: s.Nodes("match", n.Matches); s.Child("body", n.Statement); s.IntrinsicLineBreaks = true; break;
                case DeclareLocalFunctionStatement n:
                    s.Declaration(n.Name); s.Type(n.ReturnType);
                    // The current local-function writer emits parameter types/names, NOT defaults/attributes.
                    if (ContractCollections.TryCopy(n.Parameters, out var localParameters))
                    { foreach (var p in localParameters) { s.Ref(p); s.Value(p.DeclarationRevision); s.Value(p.Name); s.Name(p.Name); s.Type(p.Type); } }
                    else { s.Fail("Unowned local-function parameters."); }
                    s.Child("expression-body", n.BodyExpression); if (n.BodyExpression is null) { s.Child("block-body", n.BodyStatement); }
                    s.IntrinsicLineBreaks = true; break;
                case AttributeStatement n:
                    s.Ref(n.Data);
                    if (n.Data is not null && (n.CachedType is null || n.CachedArguments is null || n.CachedPositionalArguments is null))
                    { s.Fail("Unmaterialized attribute child projection."); break; }
                    s.Type(n.CachedType); s.Nodes("argument", n.CachedArguments);
                    if (ContractCollections.TryCopy(n.CachedPositionalArguments, out var named))
                    { for (int i = 0; i < named.Length; i++) { s.Value(named[i].Key); s.Child($"named[{i}]", named[i].Value); } }
                    else { s.Fail("Unowned named attribute arguments."); }
                    break;
                case MethodProvider n:
                    s.Value(n.DeclarationRevision); s.Ref(n.EnclosingType); s.Docs(n.XmlDocs, disableXmlDocs);
                    s.Child("signature", n.Signature, false);
                    s.Child("block-body", n.BodyStatements); if (n.BodyStatements is null) { s.Child("expression-body", n.BodyExpression); }
                    s.IntrinsicLineBreaks = true; break;
                case ConstructorProvider n:
                    s.Value(n.DeclarationRevision); s.Ref(n.EnclosingType); s.Docs(n.XmlDocs, disableXmlDocs);
                    if (n.BodyStatements is not null || n.BodyExpression is not null) { s.Child("signature", n.Signature, false); }
                    s.Child("block-body", n.BodyStatements); if (n.BodyStatements is null) { s.Child("expression-body", n.BodyExpression); }
                    s.IntrinsicLineBreaks = true; break;
                case MethodSignatureBase n when n is MethodSignature or ConstructorSignature:
                    s.SignatureMetadata(n); s.IntrinsicLayoutKnown = false;
                    s.Nodes("attribute", n.Attributes); s.Nodes("parameter", n.Parameters, false);
                    if (n is MethodSignature method && method.GenericParameterConstraints is { } constraints) { s.Nodes("constraint", constraints); }
                    if (n is ConstructorSignature constructor) { s.Type(constructor.Type); s.Child("initializer", constructor.Initializer, false); }
                    break;
                case ConstructorInitializer n:
                    s.Value(n.IsBase); s.Ref(n.TargetConstructorIntent); s.Ref(n.TargetConstructorProviderIntent);
                    s.Ref(n.OriginalSource); s.Ref(n.OriginalTargetSymbol); s.Ref(n.OriginalCompilation);
                    if (n.TargetConstructorIntent is { } target) { s.SignatureMetadata(target); s.Type(target.Type); }
                    if (n.TargetConstructorProviderIntent is { } targetProvider)
                    { s.Value(targetProvider.DeclarationRevision); s.SignatureMetadata(targetProvider.Signature); s.Type(targetProvider.Signature.Type); }
                    s.Nodes("argument", n.Arguments); break;
                case ParameterProvider n:
                    s.Value(n.DeclarationRevision); s.Value(n.EmittedDeclarationState); s.Value(n.Name); s.Name(n.Name); s.Type(n.Type); s.Ref(n.OriginalSymbol); s.Ref(n.OriginalCompilation);
                    s.Value(n.IsRef); s.Value(n.IsOut); s.Value(n.IsIn); s.Value(n.IsParams);
                    s.Nodes("attribute", n.Attributes); s.Child("default", n.DefaultValue); break;
                case FieldProvider n:
                    s.Ref(n.EnclosingType); s.Value(n.Name); s.Name(n.Name); s.Value(n.Modifiers); s.Type(n.Type);
                    s.Docs(n.XmlDocs, disableXmlDocs); s.Nodes("attribute", n.Attributes); s.Child("initializer", n.InitializationValue); s.IntrinsicLineBreaks = true; break;
                case PropertyProvider n:
                    s.Ref(n.EnclosingType); s.Value(n.Name); s.Name(n.Name); s.Value(n.Modifiers); s.Value(n.IsRef); s.Type(n.Type); s.Type(n.ExplicitInterface);
                    s.Docs(n.XmlDocs, disableXmlDocs); s.Nodes("attribute", n.Attributes); s.Child("accessors", n.Body, false);
                    if (n is IndexPropertyProvider indexer) { s.Ref(indexer.IndexerParameter); s.Value(indexer.IndexerParameter.DeclarationRevision); s.Value(indexer.IndexerParameter.EmittedDeclarationState); s.Type(indexer.IndexerParameter.Type); }
                    s.IntrinsicLineBreaks = true; break;
                case ExpressionPropertyBody n when n.GetType() == typeof(ExpressionPropertyBody): s.Child("getter", n.Getter); s.Child("setter", n.Setter); break;
                case MethodPropertyBody n when n.GetType() == typeof(MethodPropertyBody):
                    s.Value(n.SetterModifiers); s.Child("getter", n.Getter); s.Child("setter", n.Setter); s.IntrinsicLineBreaks = true; break;
                case AutoPropertyBody n when n.GetType() == typeof(AutoPropertyBody):
                    s.Value(n.HasSetter); s.Value(n.SetterModifiers); s.Child("initializer", n.InitializationExpression); break;
                default:
                    if (ReferenceEquals(node, ValueExpression.Empty) || ReferenceEquals(node, MethodBodyStatement.Empty)) { break; }
                    if (ReferenceEquals(node, MethodBodyStatement.EmptyLine)) { s.IntrinsicLineBreaks = true; break; }
                    s.Fail("Unknown/custom/raw emission boundary."); break;
            }
            s.Children = s._children.ToImmutableArray();
            var types = ImmutableArray.CreateBuilder<DeclaredTypeSnapshot>();
            foreach (var type in s._types)
            {
                if (!DeclaredTypeSnapshot.TryCapture(type, out var snapshot)) { s.Fail("Unavailable type child snapshot."); break; }
                types.Add(snapshot!);
                if (!LexicalType(type)) { s.IntrinsicTokens = false; s.IntrinsicLayoutKnown = false; }
            }
            s._typeSnapshots = types.ToImmutable();
            s._declarationSnapshots = s._declarations.Select(d => (d, d.SourceRevision, d.RequestedName)).ToImmutableArray();
            return s;
        }

        internal bool Matches(StructuredSourceShape current)
        {
            if (Opaque != current.Opaque || UnavailableReason != current.UnavailableReason || _values.Count != current._values.Count ||
                _references.Count != current._references.Count || _types.Count != current._types.Count || Children.Length != current.Children.Length ||
                _declarations.Count != current._declarations.Count) { return false; }
            for (int i = 0; i < _values.Count; i++) { if (!Equals(_values[i], current._values[i])) { return false; } }
            for (int i = 0; i < _references.Count; i++) { if (!ReferenceEquals(_references[i], current._references[i])) { return false; } }
            for (int i = 0; i < Children.Length; i++)
            {
                if (Children[i].Role != current.Children[i].Role || Children[i].EmissionBoundary != current.Children[i].EmissionBoundary ||
                    !ReferenceEquals(Children[i].Producer, current.Children[i].Producer)) { return false; }
            }
            for (int i = 0; i < _types.Count; i++) { if (!ReferenceEquals(_types[i], current._types[i])) { return false; } }
            return _typeSnapshots.All(t => t.IsCurrent()) && _metadataAttributes.All(a => a.IsCurrent()) && _declarationSnapshots.All(d =>
                d.Declaration.SourceRevision == d.Revision && d.Declaration.RequestedName == d.Name);
        }

        private void Fail(string reason) { Opaque = true; IntrinsicTokens = false; UnavailableReason ??= reason; }
        private void Value(object? value) => _values.Add(value); // only primitive/string/enum values at the audited sites above
        private void Ref(object? value) => _references.Add(value);
        private void Name(string name)
        {
            if (!SimpleIdentifier(name)) { IntrinsicTokens = false; IntrinsicLayoutKnown = false; }
        }
        private void Type(CSharpType? type)
        {
            Ref(type);
            if (type is not null)
            {
                _types.Add(type);
                if (!SimpleIdentifier(type.Name) || type.Namespace.Split('.').Any(p => p.Length != 0 && !SimpleIdentifier(p)))
                { IntrinsicTokens = false; IntrinsicLayoutKnown = false; }
            }
        }
        private static bool LexicalType(CSharpType type)
        {
            if (!SimpleIdentifier(type.Name) || type.Namespace.Split('.').Any(p => p.Length != 0 && !SimpleIdentifier(p)) ||
                !ContractCollections.TryCopy(type.Arguments, out var arguments)) { return false; }
            return arguments.All(LexicalType) && (type.DeclaringType is null || LexicalType(type.DeclaringType));
        }
        private static bool SimpleIdentifier(string name) => name.Length > 0 &&
            (name[0] == '_' || name[0] is >= 'A' and <= 'Z' or >= 'a' and <= 'z') &&
            name.All(c => c == '_' || c is >= 'A' and <= 'Z' or >= 'a' and <= 'z' or >= '0' and <= '9');
        private void Declaration(CodeWriterDeclaration? declaration)
        {
            Ref(declaration);
            if (declaration is not null)
            {
                _declarations.Add(declaration);
                if (!SimpleIdentifier(declaration.RequestedName)) { IntrinsicTokens = false; IntrinsicLayoutKnown = false; }
            }
        }
        private void Child(string role, object? child, bool boundary = true) { Ref(child); if (child is not null) { _children.Add(new(role, child, boundary)); } }
        private void Nodes<T>(string role, IReadOnlyList<T>? nodes, bool boundary = true) where T : class
        {
            Ref(nodes);
            if (!ContractCollections.TryCopy(nodes, out var children)) { Fail($"Unowned {role} collection."); return; }
            for (int i = 0; i < children.Length; i++)
            { if (children[i] is null) { Fail("Missing child object."); } else { Child($"{role}[{i}]", children[i], boundary); } }
        }
        private void Types(IReadOnlyList<CSharpType>? types)
        {
            Ref(types); if (types is null) { return; }
            if (!ContractCollections.TryCopy(types, out var children)) { Fail("Unowned type-argument collection."); return; }
            foreach (var type in children) { Type(type); }
        }
        private void Docs(XmlDocProvider? docs, bool disabled) { Ref(docs); if (!disabled) { Child("documentation", docs); } }
        private void SignatureMetadata(MethodSignatureBase signature)
        {
            Ref(signature); Value(signature.DeclarationRevision); Value(signature.Name); Value(signature.Modifiers);
            if (!SimpleIdentifier(signature.Name) || signature.NonDocumentComment is not null) { IntrinsicTokens = false; IntrinsicLayoutKnown = false; }
            Value(signature.NonDocumentComment); Type(signature.ReturnType); Ref(signature.OriginalSymbol); Ref(signature.OriginalCompilation);
            if (signature is MethodSignature method) { Types(method.GenericArguments); Type(method.ExplicitInterface); }
            // Callee declaration metadata is a dependency, NOT an emitted child of the call. Keep
            // known retained-list/formal/attribute changes observable even when selection is unavailable.
            Ref(signature.Parameters);
            if (ContractCollections.TryCopy(signature.Parameters, out var parameters))
            {
                foreach (var parameter in parameters)
                {
                    Ref(parameter);
                    if (parameter is null) { continue; }
                    Value(parameter.DeclarationRevision); Value(parameter.Name); Type(parameter.Type); Ref(parameter.DefaultValue);
                    if (parameter.DefaultValue is ValueExpression expression) { Value(expression.SourceRevision); }
                    if (parameter.DefaultValue is KeywordExpression keyword) { Value(keyword.DeclarationRevision); }
                    if (parameter.DefaultValue is ScopedApi wrapper) { Value(wrapper.DeclarationRevision); }
                    MetadataAttributes(parameter.Attributes);
                }
            }
            MetadataAttributes(signature.Attributes);
        }
        private void MetadataAttributes(IReadOnlyList<AttributeStatement> attributes)
        {
            Ref(attributes);
            if (!ContractCollections.TryCopy(attributes, out var items)) { return; }
            foreach (var attribute in items)
            {
                Ref(attribute);
                if (attribute is not null && AttributeSnapshot.TryCapture(attribute, out var snapshot)) { _metadataAttributes.Add(snapshot!); }
            }
        }
        private void Dictionary(IReadOnlyDictionary<ValueExpression, ValueExpression> dictionary)
        {
            Ref(dictionary);
            if (dictionary is not Dictionary<ValueExpression, ValueExpression> values || dictionary.GetType() != typeof(Dictionary<ValueExpression, ValueExpression>))
            { Fail("Unowned initializer dictionary."); return; }
            int i = 0;
            foreach (var pair in values) { Child($"key[{i}]", pair.Key); Child($"value[{i++}]", pair.Value); }
        }
        private void FlattenedBody(IReadOnlyList<MethodBodyStatement> body)
        {
            // Try/Catch's existing writer enumerates MethodBodyStatement and flattens only statement
            // groups. Observe those exact edges without invoking that iterator or changing its behavior.
            Ref(body);
            if (!ContractCollections.TryCopy(body, out var statements)) { Fail("Unowned flattened body."); return; }
            void Flatten(MethodBodyStatement statement, string path, HashSet<MethodBodyStatement> ancestors)
            {
                if (!ancestors.Add(statement)) { Fail("Cyclic flattened statement group."); return; }
                if (statement is MethodBodyStatements group)
                {
                    Ref(group); Value(group.SourceRevision); Ref(group.Statements);
                    if (group.GetType() != typeof(MethodBodyStatements) || !ContractCollections.TryCopy(group.Statements, out var children))
                    { Fail("Opaque flattened statement group."); }
                    else { for (int j = 0; j < children.Length; j++) { Flatten(children[j], $"{path}/statement[{j}]", ancestors); } }
                }
                else { Child(path, statement); }
                ancestors.Remove(statement);
            }
            for (int i = 0; i < statements.Length; i++) { Flatten(statements[i], $"body[{i}]", new(ReferenceEqualityComparer.Instance)); }
        }
    }
}
