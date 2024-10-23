// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Providers
{
    internal sealed class ChangeTrackingListDefinition : TypeProvider
    {
        private class ChangeTrackingListTemplate<T> { }

        private readonly MethodSignature _ensureListSignature;
        private readonly MethodSignature _getEnumeratorSignature;
        private readonly CSharpType _t;
        private readonly FieldProvider _innerListField;
        private readonly CSharpType _tArray;
        private readonly ParameterProvider _tParam;
        private readonly ParameterProvider _indexParam = new ParameterProvider("index", $"The inner list.", typeof(int));
        private VariableExpression _innerList;
        private readonly CSharpType _iListOfT;
        private readonly CSharpType _iReadOnlyListOfT;

        private ScopedApi<bool> IsUndefined { get; } = This.Property("IsUndefined").As<bool>();
        private IndexableExpression EnsureList { get; init; }

        public ChangeTrackingListDefinition()
        {
            _t = typeof(ChangeTrackingListTemplate<>).GetGenericArguments()[0];
            _iListOfT = new CSharpType(typeof(IList<>), _t);
            _iReadOnlyListOfT = new CSharpType(typeof(IReadOnlyList<>), _t);

            _ensureListSignature = new MethodSignature("EnsureList", null, MethodSignatureModifiers.Public, _iListOfT, null, Array.Empty<ParameterProvider>());
            _getEnumeratorSignature = new MethodSignature("GetEnumerator", null, MethodSignatureModifiers.Public, new CSharpType(typeof(IEnumerator<>), _t), null, Array.Empty<ParameterProvider>());
            _innerListField = new FieldProvider(FieldModifiers.Private, _iListOfT, "_innerList", this);
            _innerList = new VariableExpression(_iListOfT, _innerListField.Declaration);
            _tArray = typeof(ChangeTrackingListTemplate<>).GetGenericArguments()[0].MakeArrayType();
            _tParam = new ParameterProvider("item", $"The item.", _t);
            EnsureList = new(This.Invoke(_ensureListSignature));
        }

        protected override TypeSignatureModifiers GetDeclarationModifiers()
        {
            return TypeSignatureModifiers.Internal;
        }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override string BuildName() => "ChangeTrackingList";

        protected override ConstructorProvider[] BuildConstructors()
        {
            var iList = new ParameterProvider("innerList", $"The inner list.", _iListOfT);
            var iListSignature = new ConstructorSignature(Type, null, MethodSignatureModifiers.Public, [iList]);
            var iListBody = new MethodBodyStatement[]
            {
                new IfStatement(iList.NotEqual(Null))
                {
                    _innerList.Assign(iList).Terminate()
                }
            };

            var iReadOnlyList = new ParameterProvider("innerList", $"The inner list.", _iReadOnlyListOfT);
            var iReadOnlyListSignature = new ConstructorSignature(Type, null, MethodSignatureModifiers.Public, [iReadOnlyList]);
            var iReadOnlyListBody = new MethodBodyStatement[]
            {
                new IfStatement(iReadOnlyList.NotEqual(Null))
                {
                    _innerList.Assign(iReadOnlyList.ToList()).Terminate()
                }
            };

            return
            [
                new ConstructorProvider(new ConstructorSignature(Type, null, MethodSignatureModifiers.Public, Array.Empty<ParameterProvider>()), MethodBodyStatement.Empty, this),
                new ConstructorProvider(iListSignature, iListBody, this),
                new ConstructorProvider(iReadOnlyListSignature, iReadOnlyListBody, this)
            ];
        }

        protected override CSharpType[] GetTypeArguments()
        {
            return [_t];
        }

        protected override CSharpType[] BuildImplements()
        {
            return [_iListOfT, _iReadOnlyListOfT];
        }

        protected override FieldProvider[] BuildFields()
        {
            return [_innerListField];
        }

        protected override PropertyProvider[] BuildProperties() =>
            [
                new PropertyProvider(null, MethodSignatureModifiers.Public, typeof(bool), "IsUndefined", new ExpressionPropertyBody(_innerList.Equal(Null)), this),
                BuildCount(),
                BuildIsReadOnly(),
                BuildIndexer()
            ];

        private PropertyProvider BuildIsReadOnly()
        {
            return new PropertyProvider($"Gets the IsReadOnly", MethodSignatureModifiers.Public, typeof(bool), "IsReadOnly",
                        new ExpressionPropertyBody(new TernaryConditionalExpression(
                            IsUndefined,
                            False,
                            new MemberExpression(EnsureList, "IsReadOnly"))),
                        this);
        }

        private PropertyProvider BuildCount()
        {
            return new PropertyProvider(null, MethodSignatureModifiers.Public, typeof(int), "Count",
                new ExpressionPropertyBody(new TernaryConditionalExpression(
                    IsUndefined,
                    Literal(0),
                    new MemberExpression(EnsureList, "Count"))),
                this);
        }

        private PropertyProvider BuildIndexer()
        {
            return new IndexPropertyProvider(null, MethodSignatureModifiers.Public, _t, _indexParam, new MethodPropertyBody(
                new MethodBodyStatement[]
                {
                    new IfStatement(IsUndefined)
                    {
                        Throw(New.Instance(typeof(ArgumentOutOfRangeException), Nameof(_indexParam)))
                    },
                    Return(EnsureList[_indexParam]),
                },
                new MethodBodyStatement[]
                {
                    new IfStatement(IsUndefined)
                    {
                        Throw(New.Instance(typeof(ArgumentOutOfRangeException), Nameof(_indexParam)))
                    },
                    EnsureList[_indexParam].Assign(Value).Terminate()
                }),
                this);
        }

        protected override MethodProvider[] BuildMethods()
        {
            return
            [
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
            ];
        }

        private MethodProvider BuildRemoveAt()
        {
            return new MethodProvider(new MethodSignature("RemoveAt", null, MethodSignatureModifiers.Public, null, null, [_indexParam]), new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Throw(New.Instance(typeof(ArgumentOutOfRangeException), Nameof(_indexParam)))
                },
                EnsureList.Invoke("RemoveAt", [_indexParam], false).Terminate()
            },
            this);
        }

        private MethodProvider BuildInsert()
        {
            return new MethodProvider(new MethodSignature("Insert", null, MethodSignatureModifiers.Public, null, null, [_indexParam, _tParam]), new MethodBodyStatement[]
            {
                EnsureList.Invoke("Insert", [_indexParam, _tParam], false).Terminate()
            },
            this);
        }

        private MethodProvider BuildIndexOf()
        {
            var signature = new MethodSignature("IndexOf", null, MethodSignatureModifiers.Public, typeof(int), null, [_tParam]);
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
            var signature = new MethodSignature("Remove", null, MethodSignatureModifiers.Public, typeof(bool), null, [_tParam]);
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
            return new MethodProvider(new MethodSignature("CopyTo", null, MethodSignatureModifiers.Public, null, null, [arrayParam, arrayIndexParam]), new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return()
                },
                EnsureList.Invoke("CopyTo", [arrayParam, arrayIndexParam], false).Terminate()
            },
            this);
        }

        private MethodProvider BuildContains()
        {
            var signature = new MethodSignature("Contains", null, MethodSignatureModifiers.Public, typeof(bool), null, new ParameterProvider[] { _tParam });
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
            return new MethodProvider(new MethodSignature("Clear", null, MethodSignatureModifiers.Public, null, null, Array.Empty<ParameterProvider>()), new MethodBodyStatement[]
            {
                EnsureList.Invoke("Clear").Terminate()
            },
            this);
        }

        private MethodProvider BuildAdd()
        {
            var genericParameter = new ParameterProvider("item", $"The item to add.", _t);
            return new MethodProvider(new MethodSignature("Add", null, MethodSignatureModifiers.Public, null, null, [genericParameter]), new MethodBodyStatement[]
            {
                EnsureList.Invoke("Add", genericParameter).Terminate()
            },
            this);
        }

        private MethodProvider BuildGetEnumerator()
        {
            return new MethodProvider(new MethodSignature("GetEnumerator", null, MethodSignatureModifiers.None, typeof(IEnumerator), null, Array.Empty<ParameterProvider>(), ExplicitInterface: typeof(IEnumerable)), new MethodBodyStatement[]
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
                    new DeclareLocalFunctionStatement(new CodeWriterDeclaration("enumerateEmpty"), Array.Empty<ParameterProvider>(), new CSharpType(typeof(IEnumerator<>), _t), new KeywordExpression("yield", new KeywordExpression("break", null)).Terminate()),
                    Return(Static().Invoke("enumerateEmpty", Array.Empty<ValueExpression>()))
                },
                Return(EnsureList.Invoke(_getEnumeratorSignature))
            },
            this);
        }

        private MethodProvider BuildReset()
        {
            return new MethodProvider(new MethodSignature("Reset", null, MethodSignatureModifiers.Public, null, null, Array.Empty<ParameterProvider>()), new MethodBodyStatement[]
            {
                _innerList.Assign(Null).Terminate()
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
