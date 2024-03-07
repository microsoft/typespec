// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.Output.Models.Shared;
using static AutoRest.CSharp.Common.Output.Models.Snippets;

namespace AutoRest.CSharp.Output.Models.Types
{
    internal class OptionalTypeProvider : ExpressionTypeProvider
    {
        private static readonly Lazy<OptionalTypeProvider> _instance = new(() => new OptionalTypeProvider(Configuration.Namespace, null));
        public static OptionalTypeProvider Instance => _instance.Value;

        private class ListTemplate<T> { }
        private class DictionaryTemplate<TKey, TValue> { }

        private readonly CSharpType _t = typeof(ListTemplate<>).GetGenericArguments()[0];
        private readonly CSharpType _tKey = typeof(DictionaryTemplate<,>).GetGenericArguments()[0];
        private readonly CSharpType _tValue = typeof(DictionaryTemplate<,>).GetGenericArguments()[1];
        private readonly CSharpType _genericChangeTrackingList;
        private readonly CSharpType _genericChangeTrackingDictionary;

        private OptionalTypeProvider(string defaultNamespace, SourceInputModel? sourceInputModel)
            : base(defaultNamespace, sourceInputModel)
        {
            DeclarationModifiers = TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static;
            _genericChangeTrackingList = ChangeTrackingListProvider.Instance.Type;
            _genericChangeTrackingDictionary = new CSharpType(Configuration.ApiTypes.ChangeTrackingDictionaryType, _tKey, _tValue);
        }

        protected override string DefaultName => "Optional";

        protected override IEnumerable<Method> BuildMethods()
        {
            yield return BuildIsListDefined();
            yield return BuildIsDictionaryDefined();
            yield return BuildIsReadOnlyDictionaryDefined();
            yield return IsStructDefined();
            yield return IsObjectDefined();
            yield return IsJsonElementDefined();
            yield return IsStringDefined();
        }

        private MethodSignature GetIsDefinedSignature(Parameter valueParam, IReadOnlyList<CSharpType>? genericArguments = null, IReadOnlyDictionary<CSharpType, FormattableString>? genericParameterConstraints = null) => new(
            "IsDefined",
            null,
            null,
            MethodSignatureModifiers.Public | MethodSignatureModifiers.Static,
            typeof(bool),
            null,
            new[] { valueParam },
            GenericArguments: genericArguments,
            GenericParameterConstraints: genericParameterConstraints);

        private MethodSignature GetIsCollectionDefinedSignature(Parameter collectionParam, params CSharpType[] cSharpTypes) => new(
            "IsCollectionDefined",
            null,
            null,
            MethodSignatureModifiers.Public | MethodSignatureModifiers.Static,
            typeof(bool),
            null,
            new[] { collectionParam },
            GenericArguments: cSharpTypes);

        private Method IsStringDefined()
        {
            var valueParam = new Parameter("value", null, typeof(string), null, ValidationType.None, null);
            var signature = GetIsDefinedSignature(valueParam);
            return new Method(signature, new MethodBodyStatement[]
            {
                Return(NotEqual(new ParameterReference(valueParam), Null))
            });
        }

        private Method IsJsonElementDefined()
        {
            var valueParam = new Parameter("value", null, typeof(JsonElement), null, ValidationType.None, null);
            var signature = GetIsDefinedSignature(valueParam);
            return new Method(signature, new MethodBodyStatement[]
            {
                Return(new JsonElementExpression(new ParameterReference(valueParam)).ValueKindNotEqualsUndefined())
            });
        }

        private Method IsObjectDefined()
        {
            var valueParam = new Parameter("value", null, typeof(object), null, ValidationType.None, null);
            var signature = GetIsDefinedSignature(valueParam);
            return new Method(signature, new MethodBodyStatement[]
            {
                Return(NotEqual(new ParameterReference(valueParam), Null))
            });
        }

        private Method IsStructDefined()
        {
            var valueParam = new Parameter("value", null, _t.WithNullable(true), null, ValidationType.None, null);
            var signature = GetIsDefinedSignature(valueParam, new[] { _t }, new Dictionary<CSharpType, FormattableString> { { _t, $"struct" } });
            return new Method(signature, new MethodBodyStatement[]
            {
                Return(new MemberExpression(new ParameterReference(valueParam), "HasValue"))
            });
        }

        private Method BuildIsReadOnlyDictionaryDefined()
        {
            var collectionParam = new Parameter("collection", null, new CSharpType(typeof(IReadOnlyDictionary<,>), _tKey, _tValue), null, ValidationType.None, null);
            var signature = GetIsCollectionDefinedSignature(collectionParam, _tKey, _tValue);
            VariableReference changeTrackingReference = new VariableReference(_genericChangeTrackingDictionary, new CodeWriterDeclaration("changeTrackingDictionary"));
            DeclarationExpression changeTrackingDeclarationExpression = new(changeTrackingReference, false);

            return new Method(signature, new MethodBodyStatement[]
            {
                Return(Not(BoolExpression.Is(new ParameterReference(collectionParam), changeTrackingDeclarationExpression)
                    .And(new MemberExpression(changeTrackingReference, "IsUndefined"))))
            });
        }

        private Method BuildIsDictionaryDefined()
        {
            var collectionParam = new Parameter("collection", null, new CSharpType(typeof(IDictionary<,>), _tKey, _tValue), null, ValidationType.None, null);
            var signature = GetIsCollectionDefinedSignature(collectionParam, _tKey, _tValue);
            VariableReference changeTrackingReference = new VariableReference(_genericChangeTrackingDictionary, new CodeWriterDeclaration("changeTrackingDictionary"));
            DeclarationExpression changeTrackingDeclarationExpression = new(changeTrackingReference, false);

            return new Method(signature, new MethodBodyStatement[]
            {
                Return(Not(BoolExpression.Is(new ParameterReference(collectionParam), changeTrackingDeclarationExpression)
                    .And(new MemberExpression(changeTrackingReference, "IsUndefined"))))
            });
        }

        private Method BuildIsListDefined()
        {
            var collectionParam = new Parameter("collection", null, new CSharpType(typeof(IEnumerable<>), _t), null, ValidationType.None, null);
            var signature = GetIsCollectionDefinedSignature(collectionParam, _t);
            VariableReference changeTrackingReference = new VariableReference(_genericChangeTrackingList, new CodeWriterDeclaration("changeTrackingList"));
            DeclarationExpression changeTrackingDeclarationExpression = new(changeTrackingReference, false);

            return new Method(signature, new MethodBodyStatement[]
            {
                Return(Not(BoolExpression.Is(new ParameterReference(collectionParam), changeTrackingDeclarationExpression)
                    .And(new MemberExpression(changeTrackingReference, "IsUndefined"))))
            });
        }

        internal BoolExpression IsDefined(TypedValueExpression value)
        {
            return new BoolExpression(new InvokeStaticMethodExpression(Type, "IsDefined", new[] { value }));
        }

        internal BoolExpression IsCollectionDefined(TypedValueExpression collection)
        {
            return new BoolExpression(new InvokeStaticMethodExpression(Type, "IsCollectionDefined", new[] { collection }));
        }
    }
}
