// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NUnit.Framework;
using AutoRest.CSharp.Output.Models.Types;

namespace AutoRest.CSharp.Output.Models.Types
{
    public class ClientOptionsTypeProviderTests
    {
        [TestCase("0.1", "V0_1")]
        [TestCase("1.0.0", "V1_0_0")]
        [TestCase("1.0.0.1", "V1_0_0_1")]
        [TestCase("1.0.0.1-beta1", "V1_0_0_1_Beta1")]
        [TestCase("1.0.0.1-beta-1", "V1_0_0_1_Beta_1")]
        [TestCase("Version-1.0.0.1-beta-1", "Version_1_0_0_1_Beta_1")]
        [TestCase("version-1.0.0.1-beta.1", "Version_1_0_0_1_Beta_1")]
        [TestCase("version.1.0.0.1-beta-1", "Version_1_0_0_1_Beta_1")]
        [TestCase("1.0.0.1-beta-1", "V1_0_0_1_Beta_1")]
        [TestCase("2021-06-01", "V2021_06_01")]
        [TestCase("2021-06", "V2021_06")]
        [TestCase("2021-06-01-beta-1", "V2021_06_01_Beta_1")]
        [TestCase("2021-06-01-preview2", "V2021_06_01_Preview2")]
        [TestCase("v2021-06-01", "V2021_06_01")]
        [TestCase("V2021-06-01-preview", "V2021_06_01_Preview")]
        [TestCase("Ver2021-06-01-preview", "Ver2021_06_01_Preview")]
        [TestCase("Ver-2021-06-01-preview", "Ver_2021_06_01_Preview")]
        [TestCase("Ver.2021-06-01-preview", "Ver_2021_06_01_Preview")]
        public void NormalizeVersion(string input, string expected)
        {
            Assert.AreEqual(expected, ClientOptionsTypeProvider.NormalizeVersion(input));
        }
    }

}
