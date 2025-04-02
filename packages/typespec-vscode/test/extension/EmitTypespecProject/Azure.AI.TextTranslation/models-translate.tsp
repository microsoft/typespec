import "@typespec/rest";
import "@azure-tools/typespec-azure-core";
import "./models-shared.tsp";
import "./models-transliterate.tsp";

using TypeSpec.Http;
using TypeSpec.Rest;
using Azure.Core;

namespace TextTranslation;

@doc("Request parameters for the translate API.")
model TranslateParameters {
  ...CommonParameters;

  #suppress "@azure-tools/typespec-azure-core/no-query-explode" "Existing Spec"
  @query(#{ explode: true })
  @doc("""
    Specifies the language of the output text. The target language must be one of the supported languages included 
    in the translation scope. For example, use to=de to translate to German.
    It's possible to translate to multiple languages simultaneously by repeating the parameter in the query string. 
    For example, use to=de&to=it to translate to German and Italian.
    """)
  to: string[];

  @query
  @doc("""
    Specifies the language of the input text. Find which languages are available to translate from by 
    looking up supported languages using the translation scope. If the from parameter isn't specified, 
    automatic language detection is applied to determine the source language.
    
    You must use the from parameter rather than autodetection when using the dynamic dictionary feature. 
    Note: the dynamic dictionary feature is case-sensitive.
    """)
  from?: string;

  @query
  @doc("""
    Defines whether the text being translated is plain text or HTML text. Any HTML needs to be a well-formed, 
    complete element. Possible values are: plain (default) or html.
    """)
  textType?: TextType = "Plain";

  @query
  @doc("""
    A string specifying the category (domain) of the translation. This parameter is used to get translations 
    from a customized system built with Custom Translator. Add the Category ID from your Custom Translator 
    project details to this parameter to use your deployed customized system. Default value is: general.
    """)
  category?: string = "general";

  @query
  @doc("""
    Specifies how profanities should be treated in translations.
    Possible values are: NoAction (default), Marked or Deleted.
    """)
  profanityAction?: ProfanityAction = ProfanityAction.NoAction;

  @query
  @doc("""
    Specifies how profanities should be marked in translations.
    Possible values are: Asterisk (default) or Tag. 
    """)
  profanityMarker?: ProfanityMarker = ProfanityMarker.Asterisk;

  @query
  @doc("""
    Specifies whether to include alignment projection from source text to translated text.
    Possible values are: true or false (default).
    """)
  includeAlignment?: boolean = false;

  @query
  @doc("""
    Specifies whether to include sentence boundaries for the input text and the translated text.
    Possible values are: true or false (default).
    """)
  includeSentenceLength?: boolean = false;

  @query
  @doc("""
    Specifies a fallback language if the language of the input text can't be identified. 
    Language autodetection is applied when the from parameter is omitted. If detection fails, 
    the suggestedFrom language will be assumed.
    """)
  suggestedFrom?: string;

  @query
  @doc("""
    Specifies the script of the input text.
    """)
  fromScript?: string;

  @query
  @doc("""
    Specifies the script of the translated text.
    """)
  toScript?: string;

  @query
  @doc("""
    Specifies that the service is allowed to fall back to a general system when a custom system doesn't exist. 
    Possible values are: true (default) or false.
    
    allowFallback=false specifies that the translation should only use systems trained for the category specified 
    by the request. If a translation for language X to language Y requires chaining through a pivot language E, 
    then all the systems in the chain (X → E and E → Y) will need to be custom and have the same category. 
    If no system is found with the specific category, the request will return a 400 status code. allowFallback=true 
    specifies that the service is allowed to fall back to a general system when a custom system doesn't exist.
    """)
  allowFallback?: boolean = true;
}

@doc("Response for the translation API.")
model TranslationResult {
  ...CommonResultHeaders;

  @bodyRoot
  @doc("Array of the translated text elements.")
  result: TranslatedTextItem[];

  @header("x-mt-system")
  @doc("""
    Specifies the system type that was used for translation for each 'to' language requested for translation. 
    The value is a comma-separated list of strings. Each string indicates a type:
    
    * Custom - Request includes a custom system and at least one custom system was used during translation.
    * Team - All other requests
    """)
  mtSystem: string;

  @header("x-metered-usage")
  @doc("""
    Specifies consumption (the number of characters for which the user will be charged) for the translation 
    job request. For example, if the word "Hello" is translated from English (en) to French (fr), 
    this field will return the value '5'.
    """)
  meteredUsage: int32;
}

@doc("Translation text type")
union TextType {
  string,

  @doc("Plain text.")
  Plain: "Plain",

  @doc("HTML-encoded text.")
  Html: "Html",
}

#suppress "@azure-tools/typespec-azure-core/use-extensible-enum" "Enums should be defined without the `@fixed` decorator."
#suppress "@azure-tools/typespec-azure-core/no-enum" "Azure services should not use the enum keyword."
@fixed
@doc("Translator profanity actions")
enum ProfanityAction {
  @doc("No Action is taken on profanity")
  NoAction: "NoAction",

  @doc("Profanity is marked.")
  Marked: "Marked",

  @doc("Profanity is deleted from the translated text.")
  Deleted: "Deleted",
}

#suppress "@azure-tools/typespec-azure-core/use-extensible-enum" "Enums should be defined without the `@fixed` decorator."
#suppress "@azure-tools/typespec-azure-core/no-enum" "Azure services should not use the enum keyword."
@fixed
@doc("Translator profanity markers")
enum ProfanityMarker {
  @doc("Profanity is marked with asterisk.")
  Asterisk: "Asterisk",

  @doc("Profanity is marked with the tags.")
  Tag: "Tag",
}

@doc("Element containing the translated text")
model TranslatedTextItem {
  @doc("The detectedLanguage property is only present in the result object when language auto-detection is requested.")
  detectedLanguage?: DetectedLanguage;

  @doc("""
    An array of translation results. The size of the array matches the number of target 
    languages specified through the to query parameter.
    """)
  translations: TranslationText[];

  @doc("""
    Input text in the default script of the source language. sourceText property is present only when 
    the input is expressed in a script that's not the usual script for the language. For example, 
    if the input were Arabic written in Latin script, then sourceText.text would be the same Arabic text 
    converted into Arab script.
    """)
  sourceText?: SourceText;
}

@doc("An object describing the detected language.")
model DetectedLanguage {
  @doc("A string representing the code of the detected language.")
  language: string;

  @doc("""
    A float value indicating the confidence in the result.
    The score is between zero and one and a low score indicates a low confidence.
    """)
  score: float32;
}

@doc("Translation result")
model TranslationText {
  @doc("A string representing the language code of the target language.")
  to: string;

  @doc("A string giving the translated text.")
  text: string;

  @doc("""
    An object giving the translated text in the script specified by the toScript parameter.
    """)
  transliteration?: TransliteratedText;

  @doc("""
    Alignment information.
    """)
  alignment?: TranslatedTextAlignment;

  @doc("""
    Sentence boundaries in the input and output texts.
    """)
  sentLen?: SentenceBoundaries;
}

@doc("Alignment information object.")
model TranslatedTextAlignment {
  @doc("""
    Maps input text to translated text. The alignment information is only provided when the request 
    parameter includeAlignment is true. Alignment is returned as a string value of the following 
    format: [[SourceTextStartIndex]:[SourceTextEndIndex]–[TgtTextStartIndex]:[TgtTextEndIndex]]. 
    The colon separates start and end index, the dash separates the languages, and space separates the words. 
    One word may align with zero, one, or multiple words in the other language, and the aligned words may 
    be non-contiguous. When no alignment information is available, the alignment element will be empty.
    """)
  proj: string;
}

@doc("An object returning sentence boundaries in the input and output texts.")
model SentenceBoundaries {
  @doc("""
    An integer array representing the lengths of the sentences in the input text. 
    The length of the array is the number of sentences, and the values are the length of each sentence.
    """)
  srcSentLen: int32[];

  @doc("""
    An integer array representing the lengths of the sentences in the translated text. 
    The length of the array is the number of sentences, and the values are the length of each sentence.
    """)
  transSentLen: int32[];
}

@doc("Input text in the default script of the source language. ")
model SourceText {
  @doc("""
    Input text in the default script of the source language.
    """)
  text: string;
}
