import "./main.tsp";
import "./models-breaksentence.tsp";
import "./models-dictionary.tsp";
import "./models-languages.tsp";
import "./models-translate.tsp";
import "./models-transliterate.tsp";
import "@azure-tools/typespec-client-generator-core";

using Azure.ClientGenerator.Core;

@@clientName(TextTranslation.BreakSentenceItem.sentLen,
  "SentencesLengths",
  "dotnet"
);
@@clientName(TextTranslation.BreakSentenceItem.sentLen,
  "SentencesLengths",
  "java"
);

@@clientName(TextTranslation.BackTranslation.numExamples,
  "ExamplesCount",
  "dotnet"
);
@@clientName(TextTranslation.BackTranslation.numExamples,
  "ExamplesCount",
  "java"
);

@@clientName(TextTranslation.DictionaryLookupParameters.from,
  "SourceLanguage",
  "dotnet"
);
@@clientName(TextTranslation.DictionaryLookupParameters.from,
  "SourceLanguage",
  "java"
);
@@clientName(TextTranslation.DictionaryLookupParameters.from,
  "from_language",
  "python"
);

@@clientName(TextTranslation.DictionaryLookupParameters.to,
  "TargetLanguage",
  "dotnet"
);
@@clientName(TextTranslation.DictionaryLookupParameters.to,
  "TargetLanguage",
  "java"
);
@@clientName(TextTranslation.DictionaryLookupParameters.to,
  "to_language",
  "python"
);

@@clientName(TextTranslation.DictionaryExamplesParameters.from,
  "SourceLanguage",
  "dotnet"
);
@@clientName(TextTranslation.DictionaryExamplesParameters.from,
  "SourceLanguage",
  "java"
);
@@clientName(TextTranslation.DictionaryExamplesParameters.from,
  "from_language",
  "python"
);

@@clientName(TextTranslation.DictionaryExamplesParameters.to,
  "TargetLanguage",
  "dotnet"
);
@@clientName(TextTranslation.DictionaryExamplesParameters.to,
  "TargetLanguage",
  "java"
);
@@clientName(TextTranslation.DictionaryExamplesParameters.to,
  "to_language",
  "python"
);

@@clientName(TextTranslation.TranslationLanguage.dir,
  "Directionality",
  "dotnet"
);
@@clientName(TextTranslation.TranslationLanguage.dir, "Directionality", "java");

@@clientName(TextTranslation.SourceDictionaryLanguage.dir,
  "Directionality",
  "dotnet"
);
@@clientName(TextTranslation.SourceDictionaryLanguage.dir,
  "Directionality",
  "java"
);

@@clientName(TextTranslation.TargetDictionaryLanguage.dir,
  "Directionality",
  "dotnet"
);
@@clientName(TextTranslation.TargetDictionaryLanguage.dir,
  "Directionality",
  "java"
);

@@clientName(TextTranslation.LanguageScript.dir, "Directionality", "dotnet");
@@clientName(TextTranslation.LanguageScript.dir, "Directionality", "java");

@@clientName(TextTranslation.TranslationText.sentLen,
  "SentenceBoundaries",
  "dotnet"
);
@@clientName(TextTranslation.TranslationText.sentLen,
  "SentenceBoundaries",
  "java"
);

@@clientName(TextTranslation.TranslationText.to, "TargetLanguage", "dotnet");
@@clientName(TextTranslation.TranslationText.to, "TargetLanguage", "java");

@@clientName(TextTranslation.SentenceBoundaries.srcSentLen,
  "SourceSentencesLengths",
  "dotnet"
);
@@clientName(TextTranslation.SentenceBoundaries.srcSentLen,
  "SourceSentencesLengths",
  "java"
);

@@clientName(TextTranslation.SentenceBoundaries.transSentLen,
  "TranslatedSentencesLengths",
  "dotnet"
);
@@clientName(TextTranslation.SentenceBoundaries.transSentLen,
  "TranslatedSentencesLengths",
  "java"
);

@@clientName(TextTranslation.DetectedLanguage.score, "Confidence", "dotnet");
@@clientName(TextTranslation.DetectedLanguage.score, "Confidence", "java");

@@clientName(TextTranslation.TranslateParameters.from,
  "SourceLanguage",
  "dotnet"
);
@@clientName(TextTranslation.TranslateParameters.from,
  "SourceLanguage",
  "java"
);
@@clientName(TextTranslation.TranslateParameters.from,
  "from_language",
  "python"
);

@@clientName(TextTranslation.TranslateParameters.to,
  "TargetLanguages",
  "dotnet"
);
@@clientName(TextTranslation.TranslateParameters.to, "TargetLanguages", "java");
@@clientName(TextTranslation.TranslateParameters.to, "to_language", "python");

@@clientName(TextTranslation.TranslateParameters.fromScript,
  "SourceLanguageScript",
  "dotnet"
);
@@clientName(TextTranslation.TranslateParameters.fromScript,
  "SourceLanguageScript",
  "java"
);

@@clientName(TextTranslation.TranslateParameters.toScript,
  "TargetLanguageScript",
  "dotnet"
);
@@clientName(TextTranslation.TranslateParameters.toScript,
  "TargetLanguageScript",
  "java"
);

@@clientName(TextTranslation.TranslateParameters.suggestedFrom,
  "SuggestedSourceLanguage",
  "dotnet"
);
@@clientName(TextTranslation.TranslateParameters.suggestedFrom,
  "SuggestedSourceLanguage",
  "java"
);

@@clientName(TextTranslation.TranslatedTextAlignment.proj,
  "Projections",
  "dotnet"
);
@@clientName(TextTranslation.TranslatedTextAlignment.proj,
  "Projections",
  "java"
);

@@clientName(TextTranslation.TransliterateParameters.fromScript,
  "SourceLanguageScript",
  "dotnet"
);
@@clientName(TextTranslation.TransliterateParameters.fromScript,
  "SourceLanguageScript",
  "java"
);

@@clientName(TextTranslation.TransliterateParameters.toScript,
  "TargetLanguageScript",
  "dotnet"
);
@@clientName(TextTranslation.TransliterateParameters.toScript,
  "TargetLanguageScript",
  "java"
);

@@clientName(TextTranslation.TransliterableScript.toScripts,
  "TargetLanguageScripts",
  "dotnet"
);
@@clientName(TextTranslation.TransliterableScript.toScripts,
  "TargetLanguageScripts",
  "java"
);
