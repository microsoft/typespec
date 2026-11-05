// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Runtime.CompilerServices;

namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers
{
    public sealed class PreparedInstanceCallProbe
    {
        public static int Constructions;
        public PreparedInstanceCallProbe() { Constructions++; }
        public string Observe(int value, [CallerArgumentExpression("value")] string expression = "", [CallerLineNumber] int line = 0) => expression;
        public string Safe(string value) => "string";
        public string Safe(object value) => "object";
        public static string StaticOnly(int value) => "static";
        public static readonly Func<int, string> StaticDelegate = value => "delegate";
        public string Mixed(object value) => "instance";
        public static string Mixed(string value) => "static";
    }
}
