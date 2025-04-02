import "@typespec/rest";
import "@typespec/versioning";
import "@azure-tools/typespec-azure-core";
import "./routes.tsp";

using TypeSpec.Rest;
using TypeSpec.Http;
using Azure.Core;
using TypeSpec.Versioning;

#suppress "@azure-tools/typespec-azure-core/auth-required" "!!FIXME!!"
@service(#{ title: "Text Translation" })
@server(
  "{Endpoint}",
  "Text translation is a cloud-based REST API feature of the Translator service that uses neural machine translation technology to enable quick and accurate source-to-target text translation in real time across all supported languages.",
  {
    @doc("""
      Supported Text Translation endpoints (protocol and hostname, for example:
          https://api.cognitive.microsofttranslator.com).
      """)
    Endpoint: url,
  }
)
@doc("""
  Text translation is a cloud-based REST API feature of the Translator service that uses neural
  machine translation technology to enable quick and accurate source-to-target text translation
  in real time across all supported languages.
  
  The following methods are supported by the Text Translation feature:
  
  Languages. Returns a list of languages supported by Translate, Transliterate, and Dictionary Lookup operations.
  
  Translate. Renders single source-language text to multiple target-language texts with a single request.
  
  Transliterate. Converts characters or letters of a source language to the corresponding characters or letters of a target language.
  
  Detect. Returns the source code language code and a boolean variable denoting whether the detected language is supported for text translation and transliteration.
  
  Dictionary lookup. Returns equivalent words for the source term in the target language.
  
  Dictionary example Returns grammatical structure and context examples for the source term and target term pair.
  """)
@versioned(APIVersion)
namespace TextTranslation;

@doc("Text Translation supported versions")
enum APIVersion {
  @doc("Version 3.0")
  v3_0: "3.0",
}
