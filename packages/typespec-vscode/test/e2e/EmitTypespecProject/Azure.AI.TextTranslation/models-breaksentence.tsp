import "@typespec/rest";
import "@azure-tools/typespec-azure-core";
import "./models-shared.tsp";
import "./models-translate.tsp";

using TypeSpec.Http;
using TypeSpec.Rest;
using Azure.Core;

namespace TextTranslation;

@doc("Request parameters for the break sentence API.")
model BreakSentenceParameters {
  ...CommonParameters;

  @query
  @doc("""
    Language tag identifying the language of the input text. 
    If a code isn't specified, automatic language detection will be applied.
    """)
  language?: string;

  @query
  @doc("""
    Script tag identifying the script used by the input text. 
    If a script isn't specified, the default script of the language will be assumed.
    """)
  script?: string;
}

@doc("Response for the Break SEntence API.")
model BreakSentenceResult {
  ...CommonResultHeaders;

  @bodyRoot
  @doc("Array of the break sentence elements.")
  result: BreakSentenceItem[];
}

@doc("Item containing break sentence result.")
model BreakSentenceItem {
  @doc("The detectedLanguage property is only present in the result object when language auto-detection is requested.")
  detectedLanguage?: DetectedLanguage;

  @doc("""
    An integer array representing the lengths of the sentences in the input text.
    The length of the array is the number of sentences, and the values are the length of each sentence.
    """)
  sentLen: int32[];
}
