// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

using System;
using NUnit.Framework;
using AutoRest.CSharp.Output.Models.Shared;

namespace AutoRest.CSharp.Output.Models.Requests.Tests
{
    public class PagingMethodTests
    {
        [TestCase("maxpagesize", ExpectedResult = true)]
        [TestCase("max_page_size", ExpectedResult = true)]
        [TestCase("pagesize", ExpectedResult = true)]
        [TestCase("page_size", ExpectedResult = true)]
        [TestCase("pageSize", ExpectedResult = true)]
        [TestCase("pageSizeInDestination", ExpectedResult = false)]
        [TestCase("page_size_of_container", ExpectedResult = false)]
        [TestCase("max_page_size_result", ExpectedResult = false)]
        public bool ValidateIsPageSizeName(string name)
        {
            return PagingMethod.IsPageSizeName(name);
        }

        [TestCase(typeof(float), ExpectedResult = true)]
        [TestCase(typeof(double), ExpectedResult = true)]
        [TestCase(typeof(decimal), ExpectedResult = true)]
        [TestCase(typeof(int), ExpectedResult = true)]
        [TestCase(typeof(long), ExpectedResult = true)]
        [TestCase(typeof(short), ExpectedResult = false)]
        [TestCase(typeof(string), ExpectedResult = false)]
        [TestCase(typeof(bool), ExpectedResult = false)]
        [TestCase(typeof(object), ExpectedResult = false)]
        public bool ValidateIsPageSizeType(Type type)
        {
            return PagingMethod.IsPageSizeType(type);
        }

        [TestCase("maxpagesize", typeof(float), ExpectedResult = true)]
        [TestCase("pagesize", typeof(decimal), ExpectedResult = true)]
        [TestCase("PageSize", typeof(double), ExpectedResult = true)]
        [TestCase("max_page_size", typeof(int), ExpectedResult = true)]
        [TestCase("page_size", typeof(long), ExpectedResult = true)]
        [TestCase("pageSize", typeof(string), ExpectedResult = false)]
        [TestCase("pageSize", typeof(short), ExpectedResult = false)]
        [TestCase("maxpagesize", typeof(bool), ExpectedResult = false)]
        [TestCase("maxpagesize", typeof(object), ExpectedResult = false)]
        [TestCase("maxpagesize", typeof(int[]), ExpectedResult = false)]
        [TestCase("maxpage", typeof(float), ExpectedResult = false)]
        [TestCase("page", typeof(decimal), ExpectedResult = false)]
        [TestCase("size", typeof(double), ExpectedResult = false)]
        [TestCase("pageSizeInDestination", typeof(short), ExpectedResult = false)]
        [TestCase("page_size_of_container", typeof(long), ExpectedResult = false)]
        [TestCase("max_page_size_result", typeof(int), ExpectedResult = false)]
        public bool ValidateIsPageSizeParameter(string name, Type inputType)
        {
            return PagingMethod.IsPageSizeParameter(new Parameter(
                name,
                $"test parameter",
                inputType,
                null,
                ValidationType.None,
                null
            ));
        }
    }
}
