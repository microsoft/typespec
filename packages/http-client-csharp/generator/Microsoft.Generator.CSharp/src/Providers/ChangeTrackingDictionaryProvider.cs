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
            _innerDictionary = new DictionarySnippet(_tKey, _tValue, new VariableExpression(_IDictionary, _innerDictionaryField.Declaration));
            _ensureDictionarySignature = new MethodSignature("EnsureDictionary", null, MethodSignatureModifiers.Public, _IDictionary, null, Array.Empty<ParameterProvider>());
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
            var signature = new ConstructorSignature(Type, null, MethodSignatureModifiers.Public, new[] { dictionaryParam });
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
            },
            this);
        }

        private MethodProvider ConstructorWithDictionary()
        {
            var dictionary = new ParameterProvider("dictionary", $"The inner dictionary.", _IDictionary);
            var signature = new ConstructorSignature(Type, null, MethodSignatureModifiers.Public, [dictionary]);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(Equal(dictionary, Null))
                {
                    Return()
                },
                Assign(_innerDictionary, New.Instance(_dictionary, dictionary))
            },
            this);
        }

        private MethodProvider DefaultConstructor()
        {
            var signature = new ConstructorSignature(Type, null, MethodSignatureModifiers.Public, Array.Empty<ParameterProvider>());
            return new MethodProvider(signature, Array.Empty<MethodBodyStatement>(), this);
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
                _IReadOnlyDictionary);
        }

        private PropertyProvider BuildEnumerableKeys()
        {
            return new PropertyProvider(null, MethodSignatureModifiers.None, new CSharpType(typeof(IEnumerable<>), _tKey), "Keys", new ExpressionPropertyBody(
                new MemberExpression(This, "Keys")),
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
                        Throw(New.Instance(typeof(KeyNotFoundException), Nameof(_indexParam)))
                    },
                    Return(new ArrayElementExpression(EnsureDictionary, _indexParam)),
                },
                new MethodBodyStatement[]
                {
                    Assign(
                        new ArrayElementExpression(EnsureDictionary, _indexParam),
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
            return new MethodSignature(name, null, modifiers, returnType, null, parameters ?? Array.Empty<ParameterProvider>(), ExplicitInterface: explicitImpl);
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
            var key = new ParameterProvider("key", $"The key to search for.", _tKey);
            var value = new ParameterProvider("value", $"The value.", _tValue, isOut: true);
            var signature = GetSignature("TryGetValue", typeof(bool), parameters: [key, value]);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Assign(value, Default),
                    Return(False)
                },
                Return(EnsureDictionary.Invoke("TryGetValue", key, new KeywordExpression("out", value)))
            },
            this);
        }

        private MethodProvider BuildRemoveKey()
        {
            var key = new ParameterProvider("key", $"The key.", _tKey);
            var signature = GetSignature("Remove", typeof(bool), parameters: [key]);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(False)
                },
                Return(EnsureDictionary.Invoke("Remove", key))
            },
            this);
        }

        private MethodProvider BuildContainsKey()
        {
            var key = new ParameterProvider("key", $"The key to search for.", _tKey);
            var signature = GetSignature("ContainsKey", typeof(bool), parameters: [key]);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(False)
                },
                Return(EnsureDictionary.Invoke("ContainsKey", key))
            },
            this);
        }

        private MethodProvider BuildAdd()
        {
            var key = new ParameterProvider("key", $"The key.", _tKey);
            var value = new ParameterProvider("value", $"The value to add.", _tValue);
            var signature = GetSignature("Add", null, parameters: [key, value]);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                EnsureDictionary.Invoke("Add", key, value).ToStatement()
            },
            this);
        }

        private MethodProvider BuildRemovePair()
        {
            var item = new ParameterProvider("item", $"The item to remove.", _keyValuePair);
            var signature = GetSignature("Remove", typeof(bool), parameters: [item]);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(False)
                },
                Return(EnsureDictionary.Invoke("Remove", item))
            },
            this);
        }

        private MethodProvider BuildCopyTo()
        {
            //TODO: This line will not honor the generic type of the array
            var array = new ParameterProvider("array", $"The array to copy.", typeof(KeyValuePair<,>).MakeArrayType());
            var index = new ParameterProvider("index", $"The index.", typeof(int));
            var signature = GetSignature("CopyTo", null, parameters: [array, index]);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return()
                },
                EnsureDictionary.Invoke("CopyTo", array, index).ToStatement()
            },
            this);
        }

        private MethodProvider BuildContains()
        {
            var item = new ParameterProvider("item", $"The item to search for.", _keyValuePair);
            var signature = GetSignature("Contains", typeof(bool), parameters: [item]);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(False)
                },
                Return(EnsureDictionary.Invoke("Contains", item))
            },
            this);
        }

        private MethodProvider BuildClear()
        {
            var signature = GetSignature("Clear", null);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                EnsureDictionary.Invoke("Clear").ToStatement()
            },
            this);
        }

        private MethodProvider BuildAddPair()
        {
            var item = new ParameterProvider("item", $"The item to add.", _keyValuePair);
            var signature = GetSignature("Add", null, parameters: [item]);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                EnsureDictionary.Invoke("Add", item).ToStatement()
            },
            this);
        }

        private MethodProvider BuildGetEnumerator()
        {
            var signature = GetSignature("GetEnumerator", typeof(IEnumerator), MethodSignatureModifiers.None, explicitImpl: typeof(IEnumerable));
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                Return(This.Invoke("GetEnumerator"))
            },
            this);
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
            },
            this);
        }

        private MethodProvider BuildEnsureDictionary()
        {
            return new MethodProvider(_ensureDictionarySignature, new MethodBodyStatement[]
            {
                Return(new BinaryOperatorExpression("??=", _innerDictionary, New.Instance(_dictionary)))
            },
            this);
        }
    }
}
