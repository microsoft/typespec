// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Models;
using static Microsoft.Generator.CSharp.Expressions.Snippets;

namespace Microsoft.Generator.CSharp
{
    internal class ChangeTrackingDictionaryProvider : TypeProvider
    {
        private static readonly Lazy<ChangeTrackingDictionaryProvider> _instance = new(() => new ChangeTrackingDictionaryProvider());
        public static ChangeTrackingDictionaryProvider Instance => _instance.Value;

        private class ChangeTrackingDictionaryTemplate<TKey, TValue> { }
        private readonly CSharpType _tKeyType = typeof(ChangeTrackingDictionaryTemplate<,>).GetGenericArguments()[0];
        private readonly CSharpType _tValueType = typeof(ChangeTrackingDictionaryTemplate<,>).GetGenericArguments()[1];

        private readonly CSharpType _dictionaryType;
        private readonly CSharpType _iDictionaryType;
        private readonly CSharpType _iReadOnlyDictionaryType;
        private readonly CSharpType _iEnumeratorType;
        private readonly CSharpType _keyValuePairType;
        private readonly FieldDeclaration _innerDictionaryField;
        private readonly DictionaryExpression _innerDictionary;
        private readonly MethodSignature _ensureDictionarySignature;

        private InvokeInstanceMethodExpression EnsureDictionary { get; init; }

        private BoolExpression IsUndefined { get; } = new BoolExpression(new MemberExpression(This, "IsUndefined"));

        private ChangeTrackingDictionaryProvider() : base(null)
        {
            Name = "ChangeTrackingDictionary";
            DeclarationModifiers = TypeSignatureModifiers.Internal | TypeSignatureModifiers.Partial;
            WhereClause = Where.NotNull(_tKeyType);
            _iDictionaryType = new CSharpType(typeof(IDictionary<,>), _tKeyType, _tValueType);
            _dictionaryType = new CSharpType(typeof(Dictionary<,>), _tKeyType, _tValueType);
            _iReadOnlyDictionaryType = new CSharpType(typeof(IReadOnlyDictionary<,>), _tKeyType, _tValueType);
            _keyValuePairType = new CSharpType(typeof(KeyValuePair<,>), _tKeyType, _tValueType);
            _iEnumeratorType = new CSharpType(typeof(IEnumerator<>), _keyValuePairType);
            _innerDictionaryField = new FieldDeclaration(FieldModifiers.Private, new CSharpType(typeof(IDictionary<,>), _tKeyType, _tValueType), "_innerDictionary");
            _innerDictionary = new DictionaryExpression(_tKeyType, _tValueType, _innerDictionaryField);
            _ensureDictionarySignature = new MethodSignature("EnsureDictionary", null, null, MethodSignatureModifiers.Public, _iDictionaryType, null, Array.Empty<Parameter>());
            EnsureDictionary = This.Invoke(_ensureDictionarySignature);
        }

        public override string Name { get; }

        protected override CSharpType[] BuildTypeArguments() => [_tKeyType, _tValueType];

        protected override FieldDeclaration[] BuildFields() => [_innerDictionaryField];

        protected override CSharpType[] BuildImplements() => [_iDictionaryType, _iReadOnlyDictionaryType];

        protected override CSharpMethod[] BuildConstructors() => [DefaultConstructor(), ConstructorWithDictionary(), ConstructorWithReadOnlyDictionary()];

        private CSharpMethod DefaultConstructor()
        {
            var signature = new ConstructorSignature(Type, null, null, MethodSignatureModifiers.Public, Array.Empty<Parameter>());
            return new(signature, EmptyStatement, CSharpMethodKinds.Constructor);
        }

        private CSharpMethod ConstructorWithDictionary()
        {
            var dicationaryParameter = new Parameter("dictionary", null, _iDictionaryType, null, ValidationType.None, null);
            var dictionary = new ParameterReference(dicationaryParameter);
            var signature = new ConstructorSignature(Type, null, null, MethodSignatureModifiers.Public, [dicationaryParameter]);
            return new(signature, new MethodBodyStatement[]
            {
                new IfStatement(Equal(dictionary, Null))
                {
                    Return()
                },
                Assign(_innerDictionary, New.Instance(_dictionaryType, dictionary))
            }, CSharpMethodKinds.Constructor);
        }

        private CSharpMethod ConstructorWithReadOnlyDictionary()
        {
            var dicationaryParameter = new Parameter("dictionary", null, _iReadOnlyDictionaryType, null, ValidationType.None, null);
            var dictionary = new DictionaryExpression(_tKeyType, _tValueType, dicationaryParameter);
            var signature = new ConstructorSignature(Type, null, null, MethodSignatureModifiers.Public, new[] { dicationaryParameter });
            return new(signature, new MethodBodyStatement[]
            {
                new IfStatement(Equal(dictionary, Null))
                {
                    Return()
                },
                Assign(_innerDictionary, New.Instance(_dictionaryType)),
                new ForeachStatement("pair", dictionary, out var pair)
                {
                    _innerDictionary.Add(pair)
                }
            }, CSharpMethodKinds.Constructor);
        }

        protected override PropertyDeclaration[] BuildProperties()
            => [BuildIsUndefined(),
                BuildCount(),
                BuildIsReadOnly(),
                BuildKeys(),
                BuildValues(),
                BuildIndexer(),
                BuildEnumerableKeys(),
                BuildEnumerableValues()];

        private PropertyDeclaration BuildEnumerableValues()
        {
            return new PropertyDeclaration(null, MethodSignatureModifiers.None, new CSharpType(typeof(IEnumerable<>), _tValueType), "Values", new ExpressionPropertyBody(
                new MemberExpression(This, "Values")),
                null,
                _iReadOnlyDictionaryType);
        }

        private PropertyDeclaration BuildEnumerableKeys()
        {
            return new PropertyDeclaration(null, MethodSignatureModifiers.None, new CSharpType(typeof(IEnumerable<>), _tKeyType), "Keys", new ExpressionPropertyBody(
                new MemberExpression(This, "Keys")),
                null,
                _iReadOnlyDictionaryType);
        }

        private PropertyDeclaration BuildIndexer()
        {
            var indexParameter = new Parameter("key", null, _tKeyType, null, ValidationType.None, null);
            var index = new ParameterReference(indexParameter);
            return new IndexerDeclaration(null, MethodSignatureModifiers.Public, _tValueType, indexParameter, new MethodPropertyBody(
                new MethodBodyStatement[]
                {
                    new IfStatement(IsUndefined)
                    {
                        Throw(New.Instance(typeof(KeyNotFoundException), Nameof(index)))
                    },
                    Return(new ArrayElementExpression(EnsureDictionary, index)),
                },
                new MethodBodyStatement[]
                {
                    Assign(
                        new ArrayElementExpression(EnsureDictionary, index),
                        Value)
                }));
        }

        private PropertyDeclaration BuildKeys()
        {
            return new PropertyDeclaration(null, MethodSignatureModifiers.Public, new CSharpType(typeof(ICollection<>), _tKeyType), "Keys",
                new ExpressionPropertyBody(new TernaryConditionalOperator(
                    IsUndefined,
                    new InvokeStaticMethodExpression(typeof(Array), nameof(Array.Empty), Array.Empty<ValueExpression>(), [_tKeyType]),
                    EnsureDictionary.Property("Keys"))));
        }

        private PropertyDeclaration BuildValues()
        {
            return new PropertyDeclaration(null, MethodSignatureModifiers.Public, new CSharpType(typeof(ICollection<>), _tValueType), "Values",
                new ExpressionPropertyBody(new TernaryConditionalOperator(
                    IsUndefined,
                    new InvokeStaticMethodExpression(typeof(Array), nameof(Array.Empty), Array.Empty<ValueExpression>(), [_tValueType]),
                    EnsureDictionary.Property("Values"))));
        }

        private PropertyDeclaration BuildIsReadOnly()
        {
            return new PropertyDeclaration(null, MethodSignatureModifiers.Public, typeof(bool), "IsReadOnly",
                new ExpressionPropertyBody(new TernaryConditionalOperator(
                    IsUndefined,
                    False,
                    EnsureDictionary.Property("IsReadOnly"))));
        }

        private PropertyDeclaration BuildCount()
        {
            return new PropertyDeclaration(null, MethodSignatureModifiers.Public, typeof(int), "Count",
                new ExpressionPropertyBody(new TernaryConditionalOperator(
                    IsUndefined,
                    Literal(0),
                    EnsureDictionary.Property("Count"))));
        }

        private PropertyDeclaration BuildIsUndefined()
        {
            return new PropertyDeclaration(null, MethodSignatureModifiers.Public, typeof(bool), "IsUndefined", new ExpressionPropertyBody(Equal(_innerDictionary, Null)));
        }

        private MethodSignature GetSignature(
            string name,
            CSharpType? returnType,
            MethodSignatureModifiers modifiers = MethodSignatureModifiers.Public,
            IReadOnlyList<Parameter>? parameters = null,
            CSharpType? explicitImpl = null)
        {
            return new MethodSignature(name, null, null, modifiers, returnType, null, parameters ?? Array.Empty<Parameter>(), ExplicitInterface: explicitImpl);
        }

        protected override CSharpMethod[] BuildMethods()
            => [
                //BuildGetEnumeratorGeneric(),
                //BuildGetEnumerator(),
                //BuildAddPair(),
                //BuildClear(),
                //BuildContains(),
                BuildCopyTo(),
                BuildRemovePair(),
                BuildAdd(),
                BuildContainsKey(),
                BuildRemoveKey(),
                BuildTryGetValue(),
                //BuildEnsureDictionary()
                ];

        private CSharpMethod BuildTryGetValue()
        {
            var keyParameter = new Parameter("key", null, _tKeyType, null, ValidationType.None, null);
            var valueParameter = new Parameter("value", null, _tValueType, null, ValidationType.None, null, IsOut: true);
            var value = new ParameterReference(valueParameter);
            var signature = GetSignature("TryGetValue", typeof(bool), parameters: [keyParameter, valueParameter]);
            return new(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Assign(value, Default),
                    Return(False)
                },
                Return(EnsureDictionary.Invoke("TryGetValue", new ParameterReference(keyParameter), new KeywordExpression("out", value)))
            }, CSharpMethodKinds.Method);
        }

        private CSharpMethod BuildRemoveKey()
        {
            var keyParameter = new Parameter("key", null, _tKeyType, null, ValidationType.None, null);
            var signature = GetSignature("Remove", typeof(bool), parameters: [keyParameter]);
            return new(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(False)
                },
                Return(EnsureDictionary.Invoke("Remove", new ParameterReference(keyParameter)))
            }, CSharpMethodKinds.Method);
        }

        private CSharpMethod BuildContainsKey()
        {
            var keyParameter = new Parameter("key", null, _tKeyType, null, ValidationType.None, null);
            var signature = GetSignature("ContainsKey", typeof(bool), parameters: [keyParameter]);
            return new(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(False)
                },
                Return(EnsureDictionary.Invoke("ContainsKey", new ParameterReference(keyParameter)))
            }, CSharpMethodKinds.Method);
        }

        private CSharpMethod BuildAdd()
        {
            var keyParameter = new Parameter("key", null, _tKeyType, null, ValidationType.None, null);
            var valueParameter = new Parameter("value", null, _tValueType, null, ValidationType.None, null);
            var signature = GetSignature("Add", null, parameters: [keyParameter, valueParameter]);
            return new(signature, new MethodBodyStatement[]
            {
                EnsureDictionary.Invoke("Add", new ParameterReference(keyParameter), new ParameterReference(valueParameter)).ToStatement()
            }, CSharpMethodKinds.Method);
        }

        private CSharpMethod BuildRemovePair()
        {
            var itemParameter = new Parameter("item", null, _keyValuePairType, null, ValidationType.None, null);
            var item = new ParameterReference(itemParameter);
            var signature = GetSignature("Remove", typeof(bool), parameters: new[] { itemParameter });
            return new(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(False)
                },
                Return(EnsureDictionary.Invoke("Remove", item))
            }, CSharpMethodKinds.Method);
        }

        private CSharpMethod BuildCopyTo()
        {
            //TODO: This line will not honor the generic type of the array
            var arrayParam = new Parameter("array", null, typeof(KeyValuePair<,>).MakeArrayType(), null, ValidationType.None, null);
            var array = new ParameterReference(arrayParam);
            var indexParam = new Parameter("index", null, typeof(int), null, ValidationType.None, null);
            var index = new ParameterReference(indexParam);
            var signature = GetSignature("CopyTo", null, parameters: new[] { arrayParam, indexParam });
            return new(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return()
                },
                EnsureDictionary.Invoke("CopyTo", array, index).ToStatement()
            }, CSharpMethodKinds.Method);
        }

        //private Method BuildContains()
        //{
        //    var itemParam = new Parameter("item", null, _keyValuePairType, null, ValidationType.None, null);
        //    var item = new ParameterReference(itemParam);
        //    var signature = GetSignature("Contains", typeof(bool), parameters: new[] { itemParam });
        //    return new Method(signature, new MethodBodyStatement[]
        //    {
        //        new IfStatement(IsUndefined)
        //        {
        //            Return(False)
        //        },
        //        Return(EnsureDictionary.Invoke("Contains", item))
        //    });
        //}

        //private Method BuildClear()
        //{
        //    var signature = GetSignature("Clear", null);
        //    return new Method(signature, new MethodBodyStatement[]
        //    {
        //        EnsureDictionary.Invoke("Clear").ToStatement()
        //    });
        //}

        //private Method BuildAddPair()
        //{
        //    var itemParam = new Parameter("item", null, _keyValuePairType, null, ValidationType.None, null);
        //    var item = new ParameterReference(itemParam);
        //    var signature = GetSignature("Add", null, parameters: new[] { itemParam });
        //    return new Method(signature, new MethodBodyStatement[]
        //    {
        //        EnsureDictionary.Invoke("Add", item).ToStatement()
        //    });
        //}

        //private Method BuildGetEnumerator()
        //{
        //    var signature = GetSignature("GetEnumerator", typeof(IEnumerator), MethodSignatureModifiers.None, explicitImpl: typeof(IEnumerable));
        //    return new Method(signature, new MethodBodyStatement[]
        //    {
        //        Return(This.Invoke("GetEnumerator"))
        //    });
        //}

        //private Method BuildGetEnumeratorGeneric()
        //{
        //    var signature = GetSignature("GetEnumerator", _iEnumeratorType);
        //    return new Method(signature, new MethodBodyStatement[]
        //    {
        //        new IfStatement(IsUndefined)
        //        {
        //            new DeclareLocalFunctionStatement(new CodeWriterDeclaration("enumerateEmpty"), Array.Empty<Parameter>(), _iEnumeratorType, new KeywordStatement("yield", new KeywordExpression("break", null))),
        //            Return(new InvokeStaticMethodExpression(null, "enumerateEmpty", Array.Empty<ValueExpression>()))
        //        },
        //        Return(EnsureDictionary.Invoke("GetEnumerator"))
        //    });
        //}

        //private Method BuildEnsureDictionary()
        //{
        //    return new Method(_ensureDictionarySignature, new MethodBodyStatement[]
        //    {
        //        Return(new BinaryOperatorExpression("??=", _innerDictionary, New.Instance(_dictionaryType)))
        //    });
        //}
    }
}
