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
    internal sealed class ChangeTrackingListProvider : TypeProvider
    {
        private static readonly Lazy<ChangeTrackingListProvider> _instance = new(() => new ChangeTrackingListProvider());

        private class ChangeTrackingListTemplate<T> { }

        private readonly MethodSignature _ensureListSignature;
        private readonly MethodSignature _getEnumeratorSignature;
        private readonly CSharpType _t;
        private readonly FieldProvider _innerListField;
        private readonly CSharpType _tArray;
        private readonly ParameterProvider _tParam;
        private readonly ParameterProvider _indexParam = new ParameterProvider("index", $"The index.", typeof(int));
        private VariableReferenceSnippet _innerList;
        private readonly CSharpType _iListOfT;
        private readonly CSharpType _iReadOnlyListOfT;

        private BoolSnippet IsUndefined { get; } = new BoolSnippet(new MemberExpression(This, "IsUndefined"));
        private InvokeInstanceMethodExpression EnsureList { get; init; }

        public static ChangeTrackingListProvider Instance => _instance.Value;

        private ChangeTrackingListProvider()
        {
            _t = typeof(ChangeTrackingListTemplate<>).GetGenericArguments()[0];
            _iListOfT = new CSharpType(typeof(IList<>), _t);
            _iReadOnlyListOfT = new CSharpType(typeof(IReadOnlyList<>), _t);

            _ensureListSignature = new MethodSignature("EnsureList", null, null, MethodSignatureModifiers.Public, _iListOfT, null, Array.Empty<ParameterProvider>());
            _getEnumeratorSignature = new MethodSignature("GetEnumerator", null, null, MethodSignatureModifiers.Public, new CSharpType(typeof(IEnumerator<>), _t), null, Array.Empty<ParameterProvider>());
            _innerListField = new FieldProvider(FieldModifiers.Private, _iListOfT, "_innerList");
            _innerList = new VariableReferenceSnippet(_iListOfT, _innerListField.Declaration);
            _tArray = typeof(ChangeTrackingListTemplate<>).GetGenericArguments()[0].MakeArrayType();
            _tParam = new ParameterProvider("item", $"The item.", _t);
            EnsureList = This.Invoke(_ensureListSignature);
        }

        protected override string GetFileName() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override TypeSignatureModifiers GetDeclarationModifiers()
        {
            return TypeSignatureModifiers.Internal;
        }

        public override string Name => "ChangeTrackingList";

        protected override MethodProvider[] BuildConstructors()
        {
            var iList = new ParameterProvider("innerList", $"The inner list.", _iListOfT);
            var iListSignature = new ConstructorSignature(Type, null, null, MethodSignatureModifiers.Public, [iList]);
            var iListBody = new MethodBodyStatement[]
            {
                new IfStatement(NotEqual(iList, Null))
                {
                    new AssignValueStatement(_innerList, iList)
                }
            };

            var iReadOnlyList = new ParameterProvider("innerList", $"The inner list.", _iReadOnlyListOfT);
            var iReadOnlyListSignature = new ConstructorSignature(Type, null, null, MethodSignatureModifiers.Public, [iReadOnlyList]);
            var iReadOnlyListBody = new MethodBodyStatement[]
            {
                new IfStatement(NotEqual(iReadOnlyList, Null))
                {
                    new AssignValueStatement(_innerList, Linq.ToList(iReadOnlyList))
                }
            };

            return
            [
                new MethodProvider(new ConstructorSignature(Type, null, null, MethodSignatureModifiers.Public, Array.Empty<ParameterProvider>()), EmptyStatement, this),
                new MethodProvider(iListSignature, iListBody, this),
                new MethodProvider(iReadOnlyListSignature, iReadOnlyListBody, this)
            ];
        }

        protected override CSharpType[] BuildTypeArguments()
        {
            return new[] { _t };
        }

        protected override CSharpType[] BuildImplements()
        {
            return new[] { _iListOfT, _iReadOnlyListOfT };
        }

        protected override FieldProvider[] BuildFields()
        {
            return new[] { _innerListField };
        }

        protected override PropertyProvider[] BuildProperties() =>
            new[]
            {
                new PropertyProvider(null, MethodSignatureModifiers.Public, typeof(bool), "IsUndefined", new ExpressionPropertyBody(Equal(_innerList, Null))),
                BuildCount(),
                BuildIsReadOnly(),
                BuildIndexer()
            };

        private PropertyProvider BuildIsReadOnly()
        {
            return new PropertyProvider($"Gets the IsReadOnly", MethodSignatureModifiers.Public, typeof(bool), "IsReadOnly",
                        new ExpressionPropertyBody(new TernaryConditionalExpression(
                            IsUndefined,
                            False,
                            new MemberExpression(EnsureList, "IsReadOnly"))));
        }

        private PropertyProvider BuildCount()
        {
            return new PropertyProvider(null, MethodSignatureModifiers.Public, typeof(int), "Count",
                new ExpressionPropertyBody(new TernaryConditionalExpression(
                    IsUndefined,
                    Literal(0),
                    new MemberExpression(EnsureList, "Count"))));
        }

        private PropertyProvider BuildIndexer()
        {
            var indexParam = new ParameterProvider("index", $"The inner list.", typeof(int));
            return new IndexerProvider(null, MethodSignatureModifiers.Public, _t, indexParam, new MethodPropertyBody(
                new MethodBodyStatement[]
                {
                    new IfStatement(IsUndefined)
                    {
                        Throw(New.Instance(typeof(ArgumentOutOfRangeException), Nameof(_indexParam)))
                    },
                    Return(new ArrayElementExpression(EnsureList, _indexParam)),
                },
                new MethodBodyStatement[]
                {
                    new IfStatement(IsUndefined)
                    {
                        Throw(New.Instance(typeof(ArgumentOutOfRangeException), Nameof(_indexParam)))
                    },
                    new AssignValueStatement(
                            new ArrayElementExpression(EnsureList, _indexParam),
                            new KeywordExpression("value", null))
                }));
        }

        protected override MethodProvider[] BuildMethods()
        {
            return new MethodProvider[]
            {
                BuildReset(),
                BuildGetEnumeratorOfT(),
                BuildGetEnumerator(),
                BuildAdd(),
                BuildClear(),
                BuildContains(),
                BuildCopyTo(),
                BuildRemove(),
                BuildIndexOf(),
                BuildInsert(),
                BuildRemoveAt(),
                BuildEnsureList()
            };
        }

        private MethodProvider BuildRemoveAt()
        {
            return new MethodProvider(new MethodSignature("RemoveAt", null, null, MethodSignatureModifiers.Public, null, null, [_indexParam]), new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Throw(New.Instance(typeof(ArgumentOutOfRangeException), Nameof(_indexParam)))
                },
                new InvokeInstanceMethodStatement(EnsureList, "RemoveAt", [_indexParam], false)
            },
            this);
        }

        private MethodProvider BuildInsert()
        {
            return new MethodProvider(new MethodSignature("Insert", null, null, MethodSignatureModifiers.Public, null, null, [_indexParam, _tParam]), new MethodBodyStatement[]
            {
                new InvokeInstanceMethodStatement(EnsureList, "Insert", [_indexParam, _tParam], false)
            },
            this);
        }

        private MethodProvider BuildIndexOf()
        {
            var signature = new MethodSignature("IndexOf", null, null, MethodSignatureModifiers.Public, typeof(int), null, [_tParam]);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(Literal(-1))
                },
                Return(EnsureList.Invoke(signature))
            },
            this);
        }

        private MethodProvider BuildRemove()
        {
            var signature = new MethodSignature("Remove", null, null, MethodSignatureModifiers.Public, typeof(bool), null, [_tParam]);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(False)
                },
                Return(EnsureList.Invoke(signature))
            },
            this);
        }

        private MethodProvider BuildCopyTo()
        {
            var arrayParam = new ParameterProvider("array", $"The array to copy to.", _tArray);
            var arrayIndexParam = new ParameterProvider("arrayIndex", $"The array index.", typeof(int));
            return new MethodProvider(new MethodSignature("CopyTo", null, null, MethodSignatureModifiers.Public, null, null, [arrayParam, arrayIndexParam]), new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return()
                },
                new InvokeInstanceMethodStatement(EnsureList, "CopyTo", [arrayParam, arrayIndexParam], false)
            },
            this);
        }

        private MethodProvider BuildContains()
        {
            var signature = new MethodSignature("Contains", null, null, MethodSignatureModifiers.Public, typeof(bool), null, new ParameterProvider[] { _tParam });
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(False)
                },
                Return(EnsureList.Invoke(signature))
            },
            this);
        }

        private MethodProvider BuildClear()
        {
            return new MethodProvider(new MethodSignature("Clear", null, null, MethodSignatureModifiers.Public, null, null, Array.Empty<ParameterProvider>()), new MethodBodyStatement[]
            {
                new InvokeInstanceMethodStatement(EnsureList, "Clear")
            },
            this);
        }

        private MethodProvider BuildAdd()
        {
            var genericParameter = new ParameterProvider("item", $"The item to add.", _t);
            return new MethodProvider(new MethodSignature("Add", null, null, MethodSignatureModifiers.Public, null, null, [genericParameter]), new MethodBodyStatement[]
            {
                new InvokeInstanceMethodStatement(EnsureList, "Add", genericParameter)
            },
            this);
        }

        private MethodProvider BuildGetEnumerator()
        {
            return new MethodProvider(new MethodSignature("GetEnumerator", null, null, MethodSignatureModifiers.None, typeof(IEnumerator), null, Array.Empty<ParameterProvider>(), ExplicitInterface: typeof(IEnumerable)), new MethodBodyStatement[]
            {
                Return(This.Invoke(_getEnumeratorSignature))
            },
            this);
        }

        private MethodProvider BuildGetEnumeratorOfT()
        {
            return new MethodProvider(_getEnumeratorSignature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    new DeclareLocalFunctionStatement(new CodeWriterDeclaration("enumerateEmpty"), Array.Empty<ParameterProvider>(), new CSharpType(typeof(IEnumerator<>), _t), new KeywordStatement("yield", new KeywordExpression("break", null))),
                    Return(new InvokeStaticMethodExpression(null, "enumerateEmpty", Array.Empty<ValueExpression>()))
                },
                Return(EnsureList.Invoke(_getEnumeratorSignature))
            },
            this);
        }

        private MethodProvider BuildReset()
        {
            return new MethodProvider(new MethodSignature("Reset", null, null, MethodSignatureModifiers.Public, null, null, Array.Empty<ParameterProvider>()), new MethodBodyStatement[]
            {
                Assign(_innerList, Null)
            },
            this);
        }

        private MethodProvider BuildEnsureList()
        {
            return new MethodProvider(_ensureListSignature, new MethodBodyStatement[]
            {
                Return(new BinaryOperatorExpression("??=", _innerList, New.Instance(new CSharpType(typeof(List<>), _t))))
            },
            this);
        }
    }
}
