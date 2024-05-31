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
    internal class ArgumentProvider : TypeProvider
    {
        private static readonly Lazy<ArgumentProvider> _instance = new(() => new ArgumentProvider());

        private class Template<T> { }

        private const string AssertNotNullMethodName = "AssertNotNull";
        private const string AssertNotNullOrEmptyMethodName = "AssertNotNullOrEmpty";
        private const string AssertNotNullOrWhiteSpaceMethodName = "AssertNotNullOrWhiteSpace";

        private readonly CSharpType _t = typeof(Template<>).GetGenericArguments()[0];
        private readonly Parameter _nameParam = new Parameter("name", $"The name.", typeof(string));
        private readonly CSharpType _nullableT;
        private readonly ParameterReferenceSnippet _nameParamRef;

        public static ArgumentProvider Instance => _instance.Value;

        private ArgumentProvider()
        {
            _nameParamRef = new ParameterReferenceSnippet(_nameParam);
            _nullableT = _t.WithNullable(true);
        }

        protected override TypeSignatureModifiers GetDeclarationModifiers()
        {
            return TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static;
        }

        public override string Name => "Argument";

        private MethodSignature GetSignature(
            string name,
            IReadOnlyList<Parameter> parameters,
            IReadOnlyList<CSharpType>? genericArguments = null,
            IReadOnlyList<WhereExpression>? whereExpressions = null,
            CSharpType? returnType = null)
        {
            return new MethodSignature(
                name,
                null,
                null,
                MethodSignatureModifiers.Static | MethodSignatureModifiers.Public,
                returnType,
                null,
                parameters,
                GenericArguments: genericArguments,
                GenericParameterConstraints: whereExpressions);
        }

        protected override CSharpMethod[] BuildMethods()
        {
            return
            [
                BuildAssertNotNull(),
              //  BuildAssertNotNullStruct(), // Currently, `_nullableT` returns `T` instead of `T?`. Tracking issue here: https://github.com/microsoft/typespec/issues/3490
                BuildAssertNotNullOrEmptyCollection(),
                BuildAssertNotNullOrEmptyString(),
                BuildAssertNotNullOrWhiteSpace(),
                BuildAssertNotDefault(),
                BuildAssertInRange(),
                BuildAssertEnumDefined(),
                BuildCheckNotNull(),
                BuildCheckNotNullOrEmptyString(),
                BuildAssertNull(),
            ];
        }


        private CSharpMethod BuildAssertNull()
        {
            var valueParam = new Parameter("value", $"The value.", _t);
            var messageParam = new Parameter("message", $"The message.", typeof(string), DefaultOf(new CSharpType(typeof(string), true)));
            var signature = GetSignature("AssertNull", [valueParam, _nameParam, messageParam], [_t]);
            var value = new ParameterReferenceSnippet(valueParam);
            var message = new ParameterReferenceSnippet(messageParam);
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                new IfStatement(NotEqual(value, Null))
                {
                    ThrowArgumentException(NullCoalescing(message, Literal("Value must be null.")))
                }
            });
        }

        private CSharpMethod BuildCheckNotNullOrEmptyString()
        {
            var valueParam = new Parameter("value", $"The value.", typeof(string));
            var signature = GetSignature("CheckNotNullOrEmpty", [valueParam, _nameParam], returnType: typeof(string));
            var value = new ParameterReferenceSnippet(valueParam);
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                AssertNotNullOrEmpty(value, _nameParamRef),
                Return(value)
            });
        }

        private CSharpMethod BuildCheckNotNull()
        {
            var valueParam = new Parameter("value", $"The value.", _t);
            var signature = GetSignature("CheckNotNull", [valueParam, _nameParam], new[] { _t }, new[] { Where.Class(_t) }, _t);
            var value = new ParameterReferenceSnippet(valueParam);
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                AssertNotNull(value, _nameParamRef),
                Return(value)
            });
        }

        private CSharpMethod BuildAssertEnumDefined()
        {
            var valueParam = new Parameter("value", $"The value.", typeof(object), null);
            var enumTypeParam = new Parameter("enumType", $"The enum value.", typeof(Type));
            var signature = GetSignature("AssertEnumDefined", [enumTypeParam, valueParam, _nameParam]);
            var enumType = new ParameterReferenceSnippet(enumTypeParam).Untyped;
            var value = new ParameterReferenceSnippet(valueParam).Untyped;
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                new IfStatement(Not(new BoolSnippet(new InvokeStaticMethodExpression(typeof(Enum), "IsDefined", [enumType, value]))))
                {
                    ThrowArgumentException(new FormattableStringExpression("Value not defined for {0}.", [new MemberExpression(enumType, "FullName")]))
                }
            });
        }

        private CSharpMethod BuildAssertInRange()
        {
            var valueParam = new Parameter("value", $"The value.", _t);
            var minParam = new Parameter("minimum", $"The minimum value.", _t);
            var maxParam = new Parameter("maximum", $"The maximum value.", _t);
            var whereExpressions = new WhereExpression[] { Where.NotNull(_t).And(new CSharpType(typeof(IComparable<>), _t)) };
            var signature = GetSignature("AssertInRange", new[] { valueParam, minParam, maxParam, _nameParam }, new[] { _t }, whereExpressions);
            var value = new ParameterReferenceSnippet(valueParam);
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                new IfStatement(GreaterThan(GetCompareToExpression(new ParameterReferenceSnippet(minParam), value), Literal(0)))
                {
                    Throw(New.ArgumentOutOfRangeException(_nameParamRef, "Value is less than the minimum allowed.", false))
                },
                new IfStatement(LessThan(GetCompareToExpression(new ParameterReferenceSnippet(maxParam), value), Literal(0)))
                {
                    Throw(New.ArgumentOutOfRangeException(_nameParamRef, "Value is greater than the maximum allowed.", false))
                }
            });
        }

        private ValueExpression GetCompareToExpression(ValueExpression left, ValueExpression right)
        {
            return left.Invoke("CompareTo", right);
        }

        private CSharpMethod BuildAssertNotDefault()
        {
            var valueParam = new Parameter("value", $"The value.", _t);
            var valueParamWithRef = new Parameter("value", $"The value.", _t, null, true);
            var whereExpressions = new WhereExpression[] { Where.Struct(_t).And(new CSharpType(typeof(IEquatable<>), _t)) };
            var signature = GetSignature("AssertNotDefault", [valueParamWithRef, _nameParam], [_t], whereExpressions);
            var value = new ParameterReferenceSnippet(valueParam);
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                new IfStatement(new BoolSnippet(value.Untyped.Invoke("Equals", Default)))
                {
                    ThrowArgumentException("Value cannot be empty.")
                }
            });
        }

        private CSharpMethod BuildAssertNotNullOrWhiteSpace()
        {
            var valueParam = new Parameter("value", $"The value.", typeof(string));
            var signature = GetSignature(AssertNotNullOrWhiteSpaceMethodName, [valueParam, _nameParam]);
            var value = new StringSnippet(valueParam);
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                AssertNotNullSnippet(valueParam),
                new IfStatement(StringSnippet.IsNullOrWhiteSpace(value))
                {
                    ThrowArgumentException("Value cannot be empty or contain only white-space characters.")
                }
            });
        }

        private CSharpMethod BuildAssertNotNullOrEmptyString()
        {
            var valueParam = new Parameter("value", $"The value.", typeof(string));
            var signature = GetSignature(AssertNotNullOrEmptyMethodName, [valueParam, _nameParam]);
            var value = new StringSnippet(valueParam);
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                AssertNotNullSnippet(valueParam),
                new IfStatement(Equal(value.Length, Literal(0)))
                {
                    ThrowArgumentException("Value cannot be an empty string.")
                }
            });
        }

        private CSharpMethod BuildAssertNotNullOrEmptyCollection()
        {
            const string throwMessage = "Value cannot be an empty collection.";
            var valueParam = new Parameter("value", $"The value.", new CSharpType(typeof(IEnumerable<>), _t));
            var signature = GetSignature(AssertNotNullOrEmptyMethodName, [valueParam, _nameParam], [_t]);
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                AssertNotNullSnippet(valueParam),
                new IfStatement(IsCollectionEmpty(valueParam, new VariableReferenceSnippet(new CSharpType(typeof(ICollection<>), _t), new CodeWriterDeclaration("collectionOfT"))))
                {
                    ThrowArgumentException(throwMessage)
                },
                new IfStatement(IsCollectionEmpty(valueParam, new VariableReferenceSnippet(typeof(ICollection), new CodeWriterDeclaration("collection"))))
                {
                    ThrowArgumentException(throwMessage)
                },
                UsingDeclare("e", new CSharpType(typeof(IEnumerator<>), _t), new ParameterReferenceSnippet(valueParam).Untyped.Invoke("GetEnumerator"), out var eVar),
                new IfStatement(Not(new BoolSnippet(eVar.Untyped.Invoke("MoveNext"))))
                {
                    ThrowArgumentException(throwMessage)
                }
            });
        }

        private static BoolSnippet IsCollectionEmpty(Parameter valueParam, VariableReferenceSnippet collection)
        {
            return BoolSnippet.Is(valueParam, new DeclarationExpression(collection.Type, collection.Declaration, false)).And(Equal(new MemberExpression(collection, "Count"), Literal(0)));
        }

        private MethodBodyStatement ThrowArgumentException(ValueExpression expression)
        {
            return Throw(New.ArgumentException(_nameParamRef, expression, false));
        }

        private MethodBodyStatement ThrowArgumentException(string message) => ThrowArgumentException(Literal(message));

        // Currently, `_nullableT` returns `T` instead of `T?`. Tracking issue here: https://github.com/microsoft/typespec/issues/3490
        //private CSharpMethod BuildAssertNotNullStruct()
        //{
        //    var valueParam = new Parameter("value", $"The value.", _nullableT);
        //    var signature = GetSignature(AssertNotNullMethodName, [valueParam, _nameParam], [_t], [Where.Struct(_t)]);
        //    var value = new ParameterReferenceSnippet(valueParam);
        //    return new CSharpMethod(signature, new MethodBodyStatement[]
        //    {
        //        new IfStatement(Not(new BoolSnippet(new MemberExpression(value, "HasValue"))))
        //        {
        //            Throw(New.ArgumentNullException(_nameParamRef, false))
        //        }
        //    });
        //}

        private CSharpMethod BuildAssertNotNull()
        {
            var valueParam = new Parameter("value", $"The value.", _t);
            var signature = GetSignature(AssertNotNullMethodName, [valueParam, _nameParam], [_t]);
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                AssertNotNullSnippet(valueParam)
            });
        }

        private IfStatement AssertNotNullSnippet(Parameter valueParam)
        {
            return new IfStatement(Is(new ParameterReferenceSnippet(valueParam), Null))
            {
                Throw(New.ArgumentNullException(_nameParamRef, false))
            };
        }

        internal MethodBodyStatement AssertNotNull(ValueExpression variable, ValueExpression? name = null)
        {
            return new InvokeStaticMethodStatement(Type, AssertNotNullMethodName, variable, name ?? Nameof(variable));
        }

        internal MethodBodyStatement AssertNotNullOrEmpty(ValueExpression variable, ValueExpression? name = null)
        {
            return new InvokeStaticMethodStatement(Type, AssertNotNullOrEmptyMethodName, variable, name ?? Nameof(variable));
        }

        internal MethodBodyStatement AssertNotNullOrWhiteSpace(ValueExpression variable, ValueExpression? name = null)
        {
            return new InvokeStaticMethodStatement(Type, AssertNotNullOrWhiteSpaceMethodName, variable, name ?? Nameof(variable));
        }
    }
}
