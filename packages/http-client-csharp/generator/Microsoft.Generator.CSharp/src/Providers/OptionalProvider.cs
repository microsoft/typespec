// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Providers
{
    internal class OptionalProvider : TypeProvider
    {
        private static readonly Lazy<OptionalProvider> _instance = new(() => new OptionalProvider());
        public static OptionalProvider Instance => _instance.Value;

        private class ListTemplate<T> { }

        private readonly CSharpType _t = typeof(ListTemplate<>).GetGenericArguments()[0];
        private readonly CSharpType _tKey = ChangeTrackingDictionaryProvider.Instance.Type.Arguments[0];
        private readonly CSharpType _tValue = ChangeTrackingDictionaryProvider.Instance.Type.Arguments[1];
        private readonly CSharpType _genericChangeTrackingList;
        private readonly CSharpType _genericChangeTrackingDictionary;

        private OptionalProvider()
        {
            _genericChangeTrackingList = ChangeTrackingListProvider.Instance.Type;
            _genericChangeTrackingDictionary = ChangeTrackingDictionaryProvider.Instance.Type;
        }

        protected override TypeSignatureModifiers GetDeclarationModifiers()
        {
            return TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static;
        }

        protected override string GetFileName() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        public override string Name => "Optional";

        protected override MethodProvider[] BuildMethods()
        {
            return
            [
                BuildIsListDefined(),
                BuildIsDictionaryDefined(),
                BuildIsReadOnlyDictionaryDefined(),
                IsStructDefined(),
                IsObjectDefined(),
                IsJsonElementDefined(),
                IsStringDefined(),
            ];
        }

        private MethodSignature GetIsDefinedSignature(ParameterProvider valueParam, IReadOnlyList<CSharpType>? genericArguments = null, IReadOnlyList<WhereExpression>? genericParameterConstraints = null) => new(
            "IsDefined",
            null,
            null,
            MethodSignatureModifiers.Public | MethodSignatureModifiers.Static,
            typeof(bool),
            null,
            [valueParam],
            GenericArguments: genericArguments,
            GenericParameterConstraints: genericParameterConstraints);

        private MethodSignature GetIsCollectionDefinedSignature(ParameterProvider collectionParam, params CSharpType[] cSharpTypes) => new(
            "IsCollectionDefined",
            null,
            null,
            MethodSignatureModifiers.Public | MethodSignatureModifiers.Static,
            typeof(bool),
            null,
            [collectionParam],
            GenericArguments: cSharpTypes);

        private MethodProvider IsStringDefined()
        {
            var valueParam = new ParameterProvider("value", $"The value.", typeof(string));
            var signature = GetIsDefinedSignature(valueParam);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                Return(NotEqual(new ParameterReferenceSnippet(valueParam), Null))
            });
        }

        private MethodProvider IsJsonElementDefined()
        {
            var valueParam = new ParameterProvider("value", $"The value.", typeof(JsonElement));
            var signature = GetIsDefinedSignature(valueParam);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                Return(new JsonElementSnippet(new ParameterReferenceSnippet(valueParam)).ValueKindNotEqualsUndefined())
            });
        }

        private MethodProvider IsObjectDefined()
        {
            var valueParam = new ParameterProvider("value", $"The value.", typeof(object));
            var signature = GetIsDefinedSignature(valueParam);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                Return(NotEqual(new ParameterReferenceSnippet(valueParam), Null))
            });
        }

        private MethodProvider IsStructDefined()
        {
            var valueParam = new ParameterProvider("value", $"The value.", _t.WithNullable(true));
            var signature = GetIsDefinedSignature(valueParam, new[] { _t }, new[] { Where.Struct(_t) });
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                Return(new MemberExpression(new ParameterReferenceSnippet(valueParam), "HasValue"))
            });
        }

        private MethodProvider BuildIsReadOnlyDictionaryDefined()
        {
            var collectionParam = new ParameterProvider("collection", $"The value.", new CSharpType(typeof(IReadOnlyDictionary<,>), _tKey, _tValue));
            var signature = GetIsCollectionDefinedSignature(collectionParam, _tKey, _tValue);
            VariableReferenceSnippet changeTrackingReference = new VariableReferenceSnippet(_genericChangeTrackingDictionary, new CodeWriterDeclaration("changeTrackingDictionary"));
            DeclarationExpression changeTrackingDeclarationExpression = new(changeTrackingReference.Type, changeTrackingReference.Declaration, false);

            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                Return(Not(BoolSnippet.Is(new ParameterReferenceSnippet(collectionParam), changeTrackingDeclarationExpression)
                    .And(new MemberExpression(changeTrackingReference, "IsUndefined"))))
            });
        }

        private MethodProvider BuildIsDictionaryDefined()
        {
            var collectionParam = new ParameterProvider("collection", $"The collection.", new CSharpType(typeof(IDictionary<,>), _tKey, _tValue));
            var signature = GetIsCollectionDefinedSignature(collectionParam, _tKey, _tValue);
            VariableReferenceSnippet changeTrackingReference = new VariableReferenceSnippet(_genericChangeTrackingDictionary, new CodeWriterDeclaration("changeTrackingDictionary"));
            DeclarationExpression changeTrackingDeclarationExpression = new(changeTrackingReference.Type, changeTrackingReference.Declaration, false);

            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                Return(Not(BoolSnippet.Is(new ParameterReferenceSnippet(collectionParam), changeTrackingDeclarationExpression)
                    .And(new MemberExpression(changeTrackingReference, "IsUndefined"))))
            });
        }

        private MethodProvider BuildIsListDefined()
        {
            var collectionParam = new ParameterProvider("collection", $"The collection.", new CSharpType(typeof(IEnumerable<>), _t));
            var signature = GetIsCollectionDefinedSignature(collectionParam, _t);
            VariableReferenceSnippet changeTrackingReference = new VariableReferenceSnippet(_genericChangeTrackingList, new CodeWriterDeclaration("changeTrackingList"));
            DeclarationExpression changeTrackingDeclarationExpression = new(changeTrackingReference.Type, changeTrackingReference.Declaration, false);

            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                Return(Not(BoolSnippet.Is(new ParameterReferenceSnippet(collectionParam), changeTrackingDeclarationExpression)
                    .And(new MemberExpression(changeTrackingReference, "IsUndefined"))))
            });
        }

        internal BoolSnippet IsDefined(TypedSnippet value)
        {
            return new BoolSnippet(new InvokeStaticMethodExpression(Type, "IsDefined", [ value ]));
        }

        internal BoolSnippet IsCollectionDefined(TypedSnippet collection)
        {
            return new BoolSnippet(new InvokeStaticMethodExpression(Type, "IsCollectionDefined", [ collection ]));
        }
    }
}
