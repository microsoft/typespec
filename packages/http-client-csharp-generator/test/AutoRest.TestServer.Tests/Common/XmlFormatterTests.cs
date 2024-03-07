using System;
using AutoRest.CSharp.AutoRest.Plugins;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests.Common
{
    public class XmlFormatterTests
    {
        [TestCaseSource(nameof(Data))]
        public void ValidateContentIsProperlyFormatted(string multilineContent, string expected)
        {
            var lines = multilineContent.Split(Environment.NewLine);
            var result = XmlFormatter.FormatContent(lines);
            Assert.AreEqual(expected, result);
        }

        // this XmlFormatter.FormatContent is a patch for the Roslyn formatter. It processes the content that has been formatted,
        // therefore we did not introduce those edge cases like the curly braces does not match, etc
        private static readonly object[] Data = new[]
        {
            new object[]
            {
                @"
            Uri endpoint = new Uri(""<https://my-service.azure.com>"");
            FirstTestTypeSpecClient client = new FirstTestTypeSpecClient(endpoint);

            Response response = await client.TopActionAsync(DateTimeOffset.Parse(""2022-05-10T14:57:31.2311892-04:00""), null);

            JsonElement result = JsonDocument.Parse(response.ContentStream).RootElement;
            Console.WriteLine(result.GetProperty(""name"").ToString());
            Console.WriteLine(result.GetProperty(""requiredUnion"").ToString());
            Console.WriteLine(result.GetProperty(""requiredLiteralString"").ToString());
            Console.WriteLine(result.GetProperty(""requiredLiteralInt"").ToString());
            Console.WriteLine(result.GetProperty(""requiredLiteralFloat"").ToString());
            Console.WriteLine(result.GetProperty(""requiredLiteralBool"").ToString());
            Console.WriteLine(result.GetProperty(""requiredBadDescription"").ToString());
            Console.WriteLine(result.GetProperty(""requiredNullableList"")[0].ToString());
", @"
Uri endpoint = new Uri(""<https://my-service.azure.com>"");
FirstTestTypeSpecClient client = new FirstTestTypeSpecClient(endpoint);

Response response = await client.TopActionAsync(DateTimeOffset.Parse(""2022-05-10T14:57:31.2311892-04:00""), null);

JsonElement result = JsonDocument.Parse(response.ContentStream).RootElement;
Console.WriteLine(result.GetProperty(""name"").ToString());
Console.WriteLine(result.GetProperty(""requiredUnion"").ToString());
Console.WriteLine(result.GetProperty(""requiredLiteralString"").ToString());
Console.WriteLine(result.GetProperty(""requiredLiteralInt"").ToString());
Console.WriteLine(result.GetProperty(""requiredLiteralFloat"").ToString());
Console.WriteLine(result.GetProperty(""requiredLiteralBool"").ToString());
Console.WriteLine(result.GetProperty(""requiredBadDescription"").ToString());
Console.WriteLine(result.GetProperty(""requiredNullableList"")[0].ToString());
"
            },
            new object[]
            {
                @"
            Uri endpoint = new Uri(""<https://my-service.azure.com>"");
            FirstTestTypeSpecClient client = new FirstTestTypeSpecClient(endpoint);

            RequestContent content = RequestContent.Create(new
            {
                name = ""<name>"",
                requiredUnion = ""<requiredUnion>"",
                requiredLiteralString = ""accept"",
                requiredLiteralInt = 123,
                requiredLiteralFloat = 1.23F,
                requiredLiteralBool = false,
                requiredBadDescription = ""<requiredBadDescription>"",
                requiredNullableList = new List<object>()
{
1234
},
            });
            Response response = await client.AnonymousBodyAsync(content);

            JsonElement result = JsonDocument.Parse(response.ContentStream).RootElement;
            Console.WriteLine(result.GetProperty(""name"").ToString());
            Console.WriteLine(result.GetProperty(""requiredUnion"").ToString());
            Console.WriteLine(result.GetProperty(""requiredLiteralString"").ToString());
            Console.WriteLine(result.GetProperty(""requiredLiteralInt"").ToString());
            Console.WriteLine(result.GetProperty(""requiredLiteralFloat"").ToString());
            Console.WriteLine(result.GetProperty(""requiredLiteralBool"").ToString());
            Console.WriteLine(result.GetProperty(""requiredBadDescription"").ToString());
            Console.WriteLine(result.GetProperty(""requiredNullableList"")[0].ToString());
", @"
Uri endpoint = new Uri(""<https://my-service.azure.com>"");
FirstTestTypeSpecClient client = new FirstTestTypeSpecClient(endpoint);

RequestContent content = RequestContent.Create(new
{
    name = ""<name>"",
    requiredUnion = ""<requiredUnion>"",
    requiredLiteralString = ""accept"",
    requiredLiteralInt = 123,
    requiredLiteralFloat = 1.23F,
    requiredLiteralBool = false,
    requiredBadDescription = ""<requiredBadDescription>"",
    requiredNullableList = new List<object>()
    {
        1234
    },
});
Response response = await client.AnonymousBodyAsync(content);

JsonElement result = JsonDocument.Parse(response.ContentStream).RootElement;
Console.WriteLine(result.GetProperty(""name"").ToString());
Console.WriteLine(result.GetProperty(""requiredUnion"").ToString());
Console.WriteLine(result.GetProperty(""requiredLiteralString"").ToString());
Console.WriteLine(result.GetProperty(""requiredLiteralInt"").ToString());
Console.WriteLine(result.GetProperty(""requiredLiteralFloat"").ToString());
Console.WriteLine(result.GetProperty(""requiredLiteralBool"").ToString());
Console.WriteLine(result.GetProperty(""requiredBadDescription"").ToString());
Console.WriteLine(result.GetProperty(""requiredNullableList"")[0].ToString());
"
            }
        };
    }
}
