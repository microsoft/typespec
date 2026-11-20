// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace __BASE_NAMESPACE__
{
    public class __BASE_NAME__
    {
        public __BASE_NAME__() { }
        public __BASE_NAME__(string first, __SECOND_TYPE__ second) { }
        public string First { get; set; }
        public __SECOND_TYPE__ Second { get; set; }
    }
}
namespace Sample.Models { public class DerivedModel : __BASE_NAMESPACE__.__BASE_NAME__ { } }
