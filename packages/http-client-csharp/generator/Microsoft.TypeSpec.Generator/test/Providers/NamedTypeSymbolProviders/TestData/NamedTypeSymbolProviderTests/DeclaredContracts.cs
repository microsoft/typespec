// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Runtime.CompilerServices;

namespace Contracts
{
    public delegate string CapturingDelegate(object value, [CallerArgumentExpression("value")] string text = "", [CallerLineNumber] int line = 0);
    public delegate object PlainDelegate(object value, string text = "");

    public partial class Api
    {
        public Api(object value, [CallerArgumentExpression("value")] string text = "") { }

        public static string Capture(object first, object second = null,
            [CallerArgumentExpression("first")] string firstText = "",
            [CallerArgumentExpression("second")] string secondText = "",
            [CallerLineNumber] int line = 0) => firstText + secondText;

        public static partial string PartialDefinition(object value, [CallerArgumentExpression("value")] string text = "");
        public static partial string PartialDefinition(object value, string text) => text;
        public static partial string PartialImplementation(object value, string text = "");
        public static partial string PartialImplementation(object value, [CallerArgumentExpression("value")] string text) => text;
        public static partial string PlainPartial(object value);
        public static partial string PlainPartial(object value) => "";

        public static void Ref(ref int value, out int other, in int input) { other = input; }
        public static void Params(params object[] values) { }
        public static object Overload(object value) => value;
        public static string Overload(string value, [CallerArgumentExpression("value")] string text = "") => text;
        public static object Implementation(object value, [CallerArgumentExpression("value")] string text = "") => text;

        public void HandlerCall(object sibling, [InterpolatedStringHandlerArgument("", "sibling")] Handler handler) { }
    }

    public sealed class Derived : Api
    {
        public Derived(object value) : base(value.ToString()) { }
    }

    [InterpolatedStringHandler]
    public struct Handler
    {
        public Handler(int literalLength, int formattedCount, Api receiver, object sibling,
            [CallerArgumentExpression("sibling")] string siblingText = "",
            [CallerArgumentExpression("receiver")] string receiverText = "") { }
        public void AppendLiteral(string text) { }
        public void AppendFormatted<T>(T value) { }
    }

    public static class Extensions
    {
        public static string Observe(this object receiver, object other = null,
            [CallerArgumentExpression("receiver")] string receiverText = "",
            [CallerArgumentExpression("other")] string otherText = "",
            [CallerLineNumber] int line = 0) => receiverText + otherText;
    }

    public static class Uses
    {
        public static void RunPlain(PlainDelegate plain) { plain(new object()); }
        public static void Run(CapturingDelegate callback, object receiver)
        {
            var reordered = Api.Capture(second: new object(), first: new object(), firstText: null);
            var explicitDefault = Api.Capture(first: null, second: default, secondText: default);
            var reduced = receiver.Observe(other: new object(), receiverText: null);
            var delegated = callback(new object());
            PlainDelegate plain = Api.Implementation;
            var plainDelegate = plain(new object());
            var overloaded = Api.Overload("value");
            var constructed = new Api(new object());
        }
    }
}
