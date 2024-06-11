// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Providers
{
    internal sealed class ChangeTrackingDictionaryProvider : TypeProvider
    {
        private static readonly Lazy<ChangeTrackingDictionaryProvider> _instance = new(() => new ChangeTrackingDictionaryProvider());
        public static ChangeTrackingDictionaryProvider Instance => _instance.Value;

        private class ChangeTrackingDictionaryTemplate<TKey, TValue> { }
        private readonly CSharpType _tKey = typeof(ChangeTrackingDictionaryTemplate<,>).GetGenericArguments()[0];
        private readonly CSharpType _tValue = typeof(ChangeTrackingDictionaryTemplate<,>).GetGenericArguments()[1];

        private readonly ParameterProvider _indexParam;
        private readonly CSharpType _dictionary;
        private readonly CSharpType _IDictionary;
        private readonly CSharpType _IReadOnlyDictionary;
        private readonly CSharpType _IEnumerator;
        private readonly CSharpType _keyValuePair;
        private readonly FieldProvider _innerDictionaryField;
        private readonly DictionarySnippet _innerDictionary;
        private readonly MethodSignature _ensureDictionarySignature;

        private InvokeInstanceMethodExpression EnsureDictionary { get; init; }
        private BoolSnippet IsUndefined { get; } = new BoolSnippet(new MemberExpression(This, "IsUndefined"));

        protected override string GetFileName() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        private ChangeTrackingDictionaryProvider()
        {
            WhereClause = Where.NotNull(_tKey);
            _indexParam = new ParameterProvider("key", $"The key.", _tKey);
            _IDictionary = new CSharpType(typeof(IDictionary<,>), _tKey, _tValue);
            _dictionary = new CSharpType(typeof(Dictionary<,>), _tKey, _tValue);
            _IReadOnlyDictionary = new CSharpType(typeof(IReadOnlyDictionary<,>), _tKey, _tValue);
            _IEnumerator = new CSharpType(typeof(IEnumerator<>), new CSharpType(typeof(KeyValuePair<,>), _tKey, _tValue));
            _keyValuePair = new CSharpType(typeof(KeyValuePair<,>), _tKey, _tValue);
            _innerDictionaryField = new FieldProvider(FieldModifiers.Private, new CSharpType(typeof(IDictionary<,>), _tKey, _tValue), "_innerDictionary");
            _innerDictionary = new DictionarySnippet(_tKey, _tValue, new VariableReferenceSnippet(_IDictionary, _innerDictionaryField.Declaration));
            _ensureDictionarySignature = new MethodSignature("EnsureDictionary", null, null, MethodSignatureModifiers.Public, _IDictionary, null, Array.Empty<ParameterProvider>());
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

        protected override FieldProvider[] BuildFields()
        {
            return new[] { _innerDictionaryField };
        }

        protected override CSharpType[] BuildImplements()
        {
            return new[] { _IDictionary, _IReadOnlyDictionary };
        }

        protected override MethodProvider[] BuildConstructors()
        {
            return new MethodProvider[]
            {
                DefaultConstructor(),
                ConstructorWithDictionary(),
                ConstructorWithReadOnlyDictionary()
            };
        }

        private MethodProvider ConstructorWithReadOnlyDictionary()
        {
            var dictionaryParam = new ParameterProvider("dictionary", $"The inner dictionary.", _IReadOnlyDictionary);
            var dictionary = new DictionarySnippet(_tKey, _tValue, dictionaryParam);
            var signature = new ConstructorSignature(Type, null, null, MethodSignatureModifiers.Public, new[] { dictionaryParam });
            return new MethodProvider(signature, new MethodBodyStatement[]
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

        private MethodProvider ConstructorWithDictionary()
        {
            var dictionaryParam = new ParameterProvider("dictionary", $"The inner dictionary.", _IDictionary);
            var dictionary = new ParameterReferenceSnippet(dictionaryParam);
            var signature = new ConstructorSignature(Type, null, null, MethodSignatureModifiers.Public, new[] { dictionaryParam });
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(Equal(dictionary, Null))
                {
                    Return()
                },
                Assign(_innerDictionary, New.Instance(_dictionary, dictionary))
            });
        }

        private MethodProvider DefaultConstructor()
        {
            var signature = new ConstructorSignature(Type, null, null, MethodSignatureModifiers.Public, Array.Empty<ParameterProvider>());
            return new MethodProvider(signature, Array.Empty<MethodBodyStatement>());
        }

        protected override PropertyProvider[] BuildProperties()
        {
            return new PropertyProvider[]
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

        private PropertyProvider BuildEnumerableValues()
        {
            return new PropertyProvider(null, MethodSignatureModifiers.None, new CSharpType(typeof(IEnumerable<>), _tValue), "Values", new ExpressionPropertyBody(
                new MemberExpression(This, "Values")),
                null,
                _IReadOnlyDictionary);
        }

        private PropertyProvider BuildEnumerableKeys()
        {
            return new PropertyProvider(null, MethodSignatureModifiers.None, new CSharpType(typeof(IEnumerable<>), _tKey), "Keys", new ExpressionPropertyBody(
                new MemberExpression(This, "Keys")),
                null,
                _IReadOnlyDictionary);
        }

        private PropertyProvider BuildIndexer()
        {
            var indexParam = new ParameterProvider("key", $"The key.", _tKey);
            return new IndexerProvider(null, MethodSignatureModifiers.Public, _tValue, indexParam, new MethodPropertyBody(
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

        private PropertyProvider BuildValues()
        {
            return new PropertyProvider(null, MethodSignatureModifiers.Public, new CSharpType(typeof(ICollection<>), _tValue), "Values",
                new ExpressionPropertyBody(new TernaryConditionalExpression(
                    IsUndefined,
                    new InvokeStaticMethodExpression(typeof(Array), "Empty", Array.Empty<ValueExpression>(), new[] { _tValue }),
                    new MemberExpression(EnsureDictionary, "Values"))));
        }

        private PropertyProvider BuildKeys()
        {
            return new PropertyProvider(null, MethodSignatureModifiers.Public, new CSharpType(typeof(ICollection<>), _tKey), "Keys",
                new ExpressionPropertyBody(new TernaryConditionalExpression(
                    IsUndefined,
                    new InvokeStaticMethodExpression(typeof(Array), "Empty", Array.Empty<ValueExpression>(), new[] { _tKey }),
                    new MemberExpression(EnsureDictionary, "Keys"))));
        }

        private PropertyProvider BuildIsReadOnly()
        {
            return new PropertyProvider($"Gets the IsReadOnly", MethodSignatureModifiers.Public, typeof(bool), "IsReadOnly",
                new ExpressionPropertyBody(new TernaryConditionalExpression(
                    IsUndefined,
                    False,
                    new MemberExpression(EnsureDictionary, "IsReadOnly"))));
        }

        private PropertyProvider BuildCount()
        {
            return new PropertyProvider(null, MethodSignatureModifiers.Public, typeof(int), "Count",
                new ExpressionPropertyBody(new TernaryConditionalExpression(
                    IsUndefined,
                    Literal(0),
                    new MemberExpression(EnsureDictionary, "Count"))));
        }

        private PropertyProvider BuildIsUndefined()
        {
            return new PropertyProvider(null, MethodSignatureModifiers.Public, typeof(bool), "IsUndefined", new ExpressionPropertyBody(Equal(_innerDictionary, Null)));
        }

        private MethodSignature GetSignature(
            string name,
            CSharpType? returnType,
            MethodSignatureModifiers modifiers = MethodSignatureModifiers.Public,
            IReadOnlyList<ParameterProvider>? parameters = null,
            CSharpType? explicitImpl = null)
        {
            return new MethodSignature(name, null, null, modifiers, returnType, null, parameters ?? Array.Empty<ParameterProvider>(), ExplicitInterface: explicitImpl);
        }

        protected override MethodProvider[] BuildMethods()
        {
            return new MethodProvider[]
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

        private MethodProvider BuildTryGetValue()
        {
            var keyParam = new ParameterProvider("key", $"The key to search for.", _tKey);
            var valueParam = new ParameterProvider("value", $"The value.", _tValue, isOut: true);
            var value = new ParameterReferenceSnippet(valueParam);
            var signature = GetSignature("TryGetValue", typeof(bool), parameters: new[] { keyParam, valueParam });
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Assign(value, Default),
                    Return(False)
                },
                Return(EnsureDictionary.Invoke("TryGetValue", new ParameterReferenceSnippet(keyParam), new KeywordExpression("out", value)))
            });
        }

        private MethodProvider BuildRemoveKey()
        {
            var keyParam = new ParameterProvider("key", $"The key.", _tKey);
            var signature = GetSignature("Remove", typeof(bool), parameters: new[] { keyParam });
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(False)
                },
                Return(EnsureDictionary.Invoke("Remove", new ParameterReferenceSnippet(keyParam)))
            });
        }

        private MethodProvider BuildContainsKey()
        {
            var keyParam = new ParameterProvider("key", $"The key to search for.", _tKey);
            var signature = GetSignature("ContainsKey", typeof(bool), parameters: new[] { keyParam });
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(False)
                },
                Return(EnsureDictionary.Invoke("ContainsKey", new ParameterReferenceSnippet(keyParam)))
            });
        }

        private MethodProvider BuildAdd()
        {
            var keyParam = new ParameterProvider("key", $"The key.", _tKey);
            var valueParam = new ParameterProvider("value", $"The value to add.", _tValue);
            var signature = GetSignature("Add", null, parameters: new[] { keyParam, valueParam });
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                EnsureDictionary.Invoke("Add", new ParameterReferenceSnippet(keyParam), new ParameterReferenceSnippet(valueParam)).ToStatement()
            });
        }

        private MethodProvider BuildRemovePair()
        {
            var itemParam = new ParameterProvider("item", $"The item to remove.", _keyValuePair);
            var item = new ParameterReferenceSnippet(itemParam);
            var signature = GetSignature("Remove", typeof(bool), parameters: new[] { itemParam });
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(False)
                },
                Return(EnsureDictionary.Invoke("Remove", item))
            });
        }

        private MethodProvider BuildCopyTo()
        {
            //TODO: This line will not honor the generic type of the array
            var arrayParam = new ParameterProvider("array", $"The array to copy.", typeof(KeyValuePair<,>).MakeArrayType());
            var array = new ParameterReferenceSnippet(arrayParam);
            var indexParam = new ParameterProvider("index", $"The index.", typeof(int));
            var index = new ParameterReferenceSnippet(indexParam);
            var signature = GetSignature("CopyTo", null, parameters: new[] { arrayParam, indexParam });
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return()
                },
                EnsureDictionary.Invoke("CopyTo", array, index).ToStatement()
            });
        }

        private MethodProvider BuildContains()
        {
            var itemParam = new ParameterProvider("item", $"The item to search for.", _keyValuePair);
            var item = new ParameterReferenceSnippet(itemParam);
            var signature = GetSignature("Contains", typeof(bool), parameters: new[] { itemParam });
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(False)
                },
                Return(EnsureDictionary.Invoke("Contains", item))
            });
        }

        private MethodProvider BuildClear()
        {
            var signature = GetSignature("Clear", null);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                EnsureDictionary.Invoke("Clear").ToStatement()
            });
        }

        private MethodProvider BuildAddPair()
        {
            var itemParam = new ParameterProvider("item", $"The item to add.", _keyValuePair);
            var item = new ParameterReferenceSnippet(itemParam);
            var signature = GetSignature("Add", null, parameters: new[] { itemParam });
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                EnsureDictionary.Invoke("Add", item).ToStatement()
            });
        }

        private MethodProvider BuildGetEnumerator()
        {
            var signature = GetSignature("GetEnumerator", typeof(IEnumerator), MethodSignatureModifiers.None, explicitImpl: typeof(IEnumerable));
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                Return(This.Invoke("GetEnumerator"))
            });
        }

        private MethodProvider BuildGetEnumeratorGeneric()
        {
            var signature = GetSignature("GetEnumerator", _IEnumerator);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    new DeclareLocalFunctionStatement(new CodeWriterDeclaration("enumerateEmpty"), Array.Empty<ParameterProvider>(), _IEnumerator, new KeywordStatement("yield", new KeywordExpression("break", null))),
                    Return(new InvokeStaticMethodExpression(null, "enumerateEmpty", Array.Empty<ValueExpression>()))
                },
                Return(EnsureDictionary.Invoke("GetEnumerator"))
            });
        }

        private MethodProvider BuildEnsureDictionary()
        {
            return new MethodProvider(_ensureDictionarySignature, new MethodBodyStatement[]
            {
                Return(new BinaryOperatorExpression("??=", _innerDictionary, New.Instance(_dictionary)))
            });
        }
    }
}
