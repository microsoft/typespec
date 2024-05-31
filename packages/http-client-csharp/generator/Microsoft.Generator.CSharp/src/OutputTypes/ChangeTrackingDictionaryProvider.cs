// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp
{
    internal class ChangeTrackingDictionaryProvider : TypeProvider
    {
        private static readonly Lazy<ChangeTrackingDictionaryProvider> _instance = new(() => new ChangeTrackingDictionaryProvider());
        public static ChangeTrackingDictionaryProvider Instance => _instance.Value;

        private class ChangeTrackingDictionaryTemplate<TKey, TValue> { }
        private readonly CSharpType _tKey = typeof(ChangeTrackingDictionaryTemplate<,>).GetGenericArguments()[0];
        private readonly CSharpType _tValue = typeof(ChangeTrackingDictionaryTemplate<,>).GetGenericArguments()[1];

        private readonly Parameter _indexParam;
        private readonly CSharpType _dictionary;
        private readonly CSharpType _IDictionary;
        private readonly CSharpType _IReadOnlyDictionary;
        private readonly CSharpType _IEnumerator;
        private readonly CSharpType _keyValuePair;
        private readonly FieldDeclaration _innerDictionaryField;
        private readonly DictionarySnippet _innerDictionary;
        private readonly MethodSignature _ensureDictionarySignature;

        private InvokeInstanceMethodExpression EnsureDictionary { get; init; }
        private BoolSnippet IsUndefined { get; } = new BoolSnippet(new MemberExpression(This, "IsUndefined"));

        private ChangeTrackingDictionaryProvider()
        {
            WhereClause = Where.NotNull(_tKey);
            _indexParam = new Parameter("key", $"The key.", _tKey);
            _IDictionary = new CSharpType(typeof(IDictionary<,>), _tKey, _tValue);
            _dictionary = new CSharpType(typeof(Dictionary<,>), _tKey, _tValue);
            _IReadOnlyDictionary = new CSharpType(typeof(IReadOnlyDictionary<,>), _tKey, _tValue);
            _IEnumerator = new CSharpType(typeof(IEnumerator<>), new CSharpType(typeof(KeyValuePair<,>), _tKey, _tValue));
            _keyValuePair = new CSharpType(typeof(KeyValuePair<,>), _tKey, _tValue);
            _innerDictionaryField = new FieldDeclaration(FieldModifiers.Private, new CSharpType(typeof(IDictionary<,>), _tKey, _tValue), "_innerDictionary");
            _innerDictionary = new DictionarySnippet(_tKey, _tValue, new VariableReferenceSnippet(_IDictionary, _innerDictionaryField.Declaration));
            _ensureDictionarySignature = new MethodSignature("EnsureDictionary", null, null, MethodSignatureModifiers.Public, _IDictionary, null, Array.Empty<Parameter>());
            EnsureDictionary = This.Invoke(_ensureDictionarySignature);
        }

        protected override TypeSignatureModifiers GetDeclarationModifiers()
        {
            return TypeSignatureModifiers.Internal;
        }

        public override string Name => "ChangeTrackingDictionary";

        protected override CSharpType[] BuildTypeArguments()
        {
            return new[] { _tKey, _tValue };
        }

        protected override FieldDeclaration[] BuildFields()
        {
            return new[] { _innerDictionaryField };
        }

        protected override CSharpType[] BuildImplements()
        {
            return new[] { _IDictionary, _IReadOnlyDictionary };
        }

        protected override CSharpMethod[] BuildConstructors()
        {
            return new CSharpMethod[]
            {
                DefaultConstructor(),
                ConstructorWithDictionary(),
                ConstructorWithReadOnlyDictionary()
            };
        }

        private CSharpMethod ConstructorWithReadOnlyDictionary()
        {
            var dictionaryParam = new Parameter("dictionary", $"The inner dictionary.", _IReadOnlyDictionary);
            var dictionary = new DictionarySnippet(_tKey, _tValue, dictionaryParam);
            var signature = new ConstructorSignature(Type, null, null, MethodSignatureModifiers.Public, new[] { dictionaryParam });
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                new IfStatement(Equal(dictionary, Null))
                {
                    Return()
                },
                Assign(_innerDictionary, New.Instance(_dictionary)),
                new ForeachStatement("pair", dictionary, out var pair)
                {
                    _innerDictionary.Add(pair)
                }
            });
        }

        private CSharpMethod ConstructorWithDictionary()
        {
            var dictionaryParam = new Parameter("dictionary", $"The inner dictionary.", _IDictionary);
            var dictionary = new ParameterReferenceSnippet(dictionaryParam);
            var signature = new ConstructorSignature(Type, null, null, MethodSignatureModifiers.Public, new[] { dictionaryParam });
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                new IfStatement(Equal(dictionary, Null))
                {
                    Return()
                },
                Assign(_innerDictionary, New.Instance(_dictionary, dictionary))
            });
        }

        private CSharpMethod DefaultConstructor()
        {
            var signature = new ConstructorSignature(Type, null, null, MethodSignatureModifiers.Public, Array.Empty<Parameter>());
            return new CSharpMethod(signature, Array.Empty<MethodBodyStatement>());
        }

        protected override PropertyDeclaration[] BuildProperties()
        {
            return new PropertyDeclaration[]
            {
                BuildIsUndefined(),
                BuildCount(),
                BuildIsReadOnly(),
                BuildKeys(),
                BuildValues(),
                BuildIndexer(),
                BuildEnumerableKeys(),
                BuildEnumerableValues()
            };
        }

        private PropertyDeclaration BuildEnumerableValues()
        {
            return new PropertyDeclaration(null, MethodSignatureModifiers.None, new CSharpType(typeof(IEnumerable<>), _tValue), "Values", new ExpressionPropertyBody(
                new MemberExpression(This, "Values")),
                null,
                _IReadOnlyDictionary);
        }

        private PropertyDeclaration BuildEnumerableKeys()
        {
            return new PropertyDeclaration(null, MethodSignatureModifiers.None, new CSharpType(typeof(IEnumerable<>), _tKey), "Keys", new ExpressionPropertyBody(
                new MemberExpression(This, "Keys")),
                null,
                _IReadOnlyDictionary);
        }

        private PropertyDeclaration BuildIndexer()
        {
            var indexParam = new Parameter("key", $"The key.", _tKey);
            return new IndexerDeclaration(null, MethodSignatureModifiers.Public, _tValue, indexParam, new MethodPropertyBody(
                new MethodBodyStatement[]
                {
                    new IfStatement(IsUndefined)
                    {
                        Throw(New.Instance(typeof(KeyNotFoundException), Nameof(new ParameterReferenceSnippet(_indexParam))))
                    },
                    Return(new ArrayElementExpression(EnsureDictionary, new ParameterReferenceSnippet(_indexParam))),
                },
                new MethodBodyStatement[]
                {
                    Assign(
                        new ArrayElementExpression(EnsureDictionary, new ParameterReferenceSnippet(_indexParam)),
                        new KeywordExpression("value", null))
                }));
        }

        private PropertyDeclaration BuildValues()
        {
            return new PropertyDeclaration(null, MethodSignatureModifiers.Public, new CSharpType(typeof(ICollection<>), _tValue), "Values",
                new ExpressionPropertyBody(new TernaryConditionalExpression(
                    IsUndefined,
                    new InvokeStaticMethodExpression(typeof(Array), "Empty", Array.Empty<ValueExpression>(), new[] { _tValue }),
                    new MemberExpression(EnsureDictionary, "Values"))));
        }

        private PropertyDeclaration BuildKeys()
        {
            return new PropertyDeclaration(null, MethodSignatureModifiers.Public, new CSharpType(typeof(ICollection<>), _tKey), "Keys",
                new ExpressionPropertyBody(new TernaryConditionalExpression(
                    IsUndefined,
                    new InvokeStaticMethodExpression(typeof(Array), "Empty", Array.Empty<ValueExpression>(), new[] { _tKey }),
                    new MemberExpression(EnsureDictionary, "Keys"))));
        }

        private PropertyDeclaration BuildIsReadOnly()
        {
            return new PropertyDeclaration($"Gets the IsReadOnly", MethodSignatureModifiers.Public, typeof(bool), "IsReadOnly",
                new ExpressionPropertyBody(new TernaryConditionalExpression(
                    IsUndefined,
                    False,
                    new MemberExpression(EnsureDictionary, "IsReadOnly"))));
        }

        private PropertyDeclaration BuildCount()
        {
            return new PropertyDeclaration(null, MethodSignatureModifiers.Public, typeof(int), "Count",
                new ExpressionPropertyBody(new TernaryConditionalExpression(
                    IsUndefined,
                    Literal(0),
                    new MemberExpression(EnsureDictionary, "Count"))));
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
        {
            return new CSharpMethod[]
            {
                BuildGetEnumeratorGeneric(),
                BuildGetEnumerator(),
                BuildAddPair(),
                BuildClear(),
                BuildContains(),
                BuildCopyTo(),
                BuildRemovePair(),
                BuildAdd(),
                BuildContainsKey(),
                BuildRemoveKey(),
                BuildTryGetValue(),
                BuildEnsureDictionary()
            };
        }

        private CSharpMethod BuildTryGetValue()
        {
            var keyParam = new Parameter("key", $"The key to search for.", _tKey);
            var valueParam = new Parameter("value", $"The value.", _tValue, isOut: true);
            var value = new ParameterReferenceSnippet(valueParam);
            var signature = GetSignature("TryGetValue", typeof(bool), parameters: new[] { keyParam, valueParam });
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Assign(value, Default),
                    Return(False)
                },
                Return(EnsureDictionary.Invoke("TryGetValue", new ParameterReferenceSnippet(keyParam), new KeywordExpression("out", value)))
            });
        }

        private CSharpMethod BuildRemoveKey()
        {
            var keyParam = new Parameter("key", $"The key.", _tKey);
            var signature = GetSignature("Remove", typeof(bool), parameters: new[] { keyParam });
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(False)
                },
                Return(EnsureDictionary.Invoke("Remove", new ParameterReferenceSnippet(keyParam)))
            });
        }

        private CSharpMethod BuildContainsKey()
        {
            var keyParam = new Parameter("key", $"The key to search for.", _tKey);
            var signature = GetSignature("ContainsKey", typeof(bool), parameters: new[] { keyParam });
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(False)
                },
                Return(EnsureDictionary.Invoke("ContainsKey", new ParameterReferenceSnippet(keyParam)))
            });
        }

        private CSharpMethod BuildAdd()
        {
            var keyParam = new Parameter("key", $"The key.", _tKey);
            var valueParam = new Parameter("value", $"The value to add.", _tValue);
            var signature = GetSignature("Add", null, parameters: new[] { keyParam, valueParam });
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                EnsureDictionary.Invoke("Add", new ParameterReferenceSnippet(keyParam), new ParameterReferenceSnippet(valueParam)).ToStatement()
            });
        }

        private CSharpMethod BuildRemovePair()
        {
            var itemParam = new Parameter("item", $"The item to remove.", _keyValuePair);
            var item = new ParameterReferenceSnippet(itemParam);
            var signature = GetSignature("Remove", typeof(bool), parameters: new[] { itemParam });
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(False)
                },
                Return(EnsureDictionary.Invoke("Remove", item))
            });
        }

        private CSharpMethod BuildCopyTo()
        {
            //TODO: This line will not honor the generic type of the array
            var arrayParam = new Parameter("array", $"The array to copy.", typeof(KeyValuePair<,>).MakeArrayType());
            var array = new ParameterReferenceSnippet(arrayParam);
            var indexParam = new Parameter("index", $"The index.", typeof(int));
            var index = new ParameterReferenceSnippet(indexParam);
            var signature = GetSignature("CopyTo", null, parameters: new[] { arrayParam, indexParam });
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return()
                },
                EnsureDictionary.Invoke("CopyTo", array, index).ToStatement()
            });
        }

        private CSharpMethod BuildContains()
        {
            var itemParam = new Parameter("item", $"The item to search for.", _keyValuePair);
            var item = new ParameterReferenceSnippet(itemParam);
            var signature = GetSignature("Contains", typeof(bool), parameters: new[] { itemParam });
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(False)
                },
                Return(EnsureDictionary.Invoke("Contains", item))
            });
        }

        private CSharpMethod BuildClear()
        {
            var signature = GetSignature("Clear", null);
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                EnsureDictionary.Invoke("Clear").ToStatement()
            });
        }

        private CSharpMethod BuildAddPair()
        {
            var itemParam = new Parameter("item", $"The item to add.", _keyValuePair);
            var item = new ParameterReferenceSnippet(itemParam);
            var signature = GetSignature("Add", null, parameters: new[] { itemParam });
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                EnsureDictionary.Invoke("Add", item).ToStatement()
            });
        }

        private CSharpMethod BuildGetEnumerator()
        {
            var signature = GetSignature("GetEnumerator", typeof(IEnumerator), MethodSignatureModifiers.None, explicitImpl: typeof(IEnumerable));
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                Return(This.Invoke("GetEnumerator"))
            });
        }

        private CSharpMethod BuildGetEnumeratorGeneric()
        {
            var signature = GetSignature("GetEnumerator", _IEnumerator);
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    new DeclareLocalFunctionStatement(new CodeWriterDeclaration("enumerateEmpty"), Array.Empty<Parameter>(), _IEnumerator, new KeywordStatement("yield", new KeywordExpression("break", null))),
                    Return(new InvokeStaticMethodExpression(null, "enumerateEmpty", Array.Empty<ValueExpression>()))
                },
                Return(EnsureDictionary.Invoke("GetEnumerator"))
            });
        }

        private CSharpMethod BuildEnsureDictionary()
        {
            return new CSharpMethod(_ensureDictionarySignature, new MethodBodyStatement[]
            {
                Return(new BinaryOperatorExpression("??=", _innerDictionary, New.Instance(_dictionary)))
            });
        }
    }
}
