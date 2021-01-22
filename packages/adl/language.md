&emsp;&emsp;<a name="SourceCharacter"></a>*SourceCharacter* **:**  
&emsp;&emsp;&emsp;<a name="SourceCharacter-c64b38bd"></a>any Unicode code point  
  
&emsp;&emsp;<a name="InputElement"></a>*InputElement* **:**  
&emsp;&emsp;&emsp;<a name="InputElement-a1141eb9"></a>*[Token](#Token)*  
&emsp;&emsp;&emsp;<a name="InputElement-286e721a"></a>*[Trivia](#Trivia)*  
  
&emsp;&emsp;<a name="Token"></a>*Token* **:**  
&emsp;&emsp;&emsp;<a name="Token-a3926e03"></a>*[Keyword](#Keyword)*  
&emsp;&emsp;&emsp;<a name="Token-06b6ace8"></a>*[Identifier](#Identifier)*  
&emsp;&emsp;&emsp;<a name="Token-a548b407"></a>*[NumericLiteral](#NumericLiteral)*  
&emsp;&emsp;&emsp;<a name="Token-5c74e54d"></a>*[StringLiteral](#StringLiteral)*  
&emsp;&emsp;&emsp;<a name="Token-ee18f3d6"></a>*[Punctuator](#Punctuator)*  
  
&emsp;&emsp;<a name="Trivia"></a>*Trivia* **:**  
&emsp;&emsp;&emsp;<a name="Trivia-153d7a58"></a>*[Comment](#Comment)*  
&emsp;&emsp;&emsp;<a name="Trivia-1424dc49"></a>*[WhiteSpace](#WhiteSpace)*  
&emsp;&emsp;&emsp;<a name="Trivia-3b331ccd"></a>*[LineTerminator](#LineTerminator)*  
  
&emsp;&emsp;<a name="Keyword"></a>*Keyword* **:**  
&emsp;&emsp;&emsp;<a name="Keyword-3508e1fd"></a>*[BooleanLiteral](#BooleanLiteral)*  
&emsp;&emsp;&emsp;<a name="Keyword-0330acf5"></a>`` import ``  
&emsp;&emsp;&emsp;<a name="Keyword-fa60d604"></a>`` model ``  
&emsp;&emsp;&emsp;<a name="Keyword-ef54526d"></a>`` interface ``  
&emsp;&emsp;&emsp;<a name="Keyword-921cc095"></a>`` alias ``  
  
&emsp;&emsp;<a name="Identifier"></a>*Identifier* **:**  
&emsp;&emsp;&emsp;<a name="Identifier-11758399"></a>*[IdentifierName](#IdentifierName)* **but not** *[Keyword](#Keyword)*  
  
&emsp;&emsp;<a name="IdentifierName"></a>*IdentifierName* **:**  
&emsp;&emsp;&emsp;<a name="IdentifierName-434685ab"></a>*[IdentifierStart](#IdentifierStart)*  
&emsp;&emsp;&emsp;<a name="IdentifierName-68c82e38"></a>*[IdentifierName](#IdentifierName)*&emsp;*[IdentifierContinue](#IdentifierContinue)*  
  
&emsp;&emsp;<a name="IdentifierStart"></a>*IdentifierStart* **:**  
&emsp;&emsp;&emsp;<a name="IdentifierStart-d2e8afad"></a>any Unicode code point with the Unicode property "ID_Start" or "Other_ID_Start"  
&emsp;&emsp;&emsp;<a name="IdentifierStart-1262cc92"></a>`` $ ``  
&emsp;&emsp;&emsp;<a name="IdentifierStart-07564b94"></a>`` _ ``  
  
&emsp;&emsp;<a name="IdentifierContinue"></a>*IdentifierContinue* **:**  
&emsp;&emsp;&emsp;<a name="IdentifierContinue-75cd6b24"></a>any Unicode code point with the Unicode property "ID_Continue" or "Other_ID_Continue", or "Other_ID_Start"  
&emsp;&emsp;&emsp;<a name="IdentifierContinue-1262cc92"></a>`` $ ``  
&emsp;&emsp;&emsp;<a name="IdentifierContinue-07564b94"></a>`` _ ``  
&emsp;&emsp;&emsp;<a name="IdentifierContinue-60d2dd13"></a>&lt;ZWNJ&gt;  
&emsp;&emsp;&emsp;<a name="IdentifierContinue-cdf80ff5"></a>&lt;ZWJ&gt;  
  
&emsp;&emsp;<a name="BooleanLiteral"></a>*BooleanLiteral* **:**  
&emsp;&emsp;&emsp;<a name="BooleanLiteral-fa30b8c6"></a>`` true ``  
&emsp;&emsp;&emsp;<a name="BooleanLiteral-23d2c69d"></a>`` false ``  
  
&emsp;&emsp;<a name="NumericLiteral"></a>*NumericLiteral* **:**  
&emsp;&emsp;&emsp;<a name="NumericLiteral-18c0356f"></a>*[DecimalLiteral](#DecimalLiteral)*  
&emsp;&emsp;&emsp;<a name="NumericLiteral-1d0c4a66"></a>*[HexIntegerLiteral](#HexIntegerLiteral)*  
  
&emsp;&emsp;<a name="DecimalLiteral"></a>*DecimalLiteral* **:**  
&emsp;&emsp;&emsp;<a name="DecimalLiteral-fb5198a6"></a>*[DecimalIntegerLiteral](#DecimalIntegerLiteral)*&emsp;`` . ``&emsp;*[DecimalDigits](#DecimalDigits)*<sub>opt</sub>&emsp;*[ExponentPart](#ExponentPart)*<sub>opt</sub>  
&emsp;&emsp;&emsp;<a name="DecimalLiteral-5cf3aa35"></a>`` . ``&emsp;*[DecimalDigits](#DecimalDigits)*&emsp;*[ExponentPart](#ExponentPart)*<sub>opt</sub>  
&emsp;&emsp;&emsp;<a name="DecimalLiteral-13dbaf21"></a>*[DecimalIntegerLiteral](#DecimalIntegerLiteral)*&emsp;*[ExponentPart](#ExponentPart)*<sub>opt</sub>  
  
&emsp;&emsp;<a name="DecimalIntegerLiteral"></a>*DecimalIntegerLiteral* **:**  
&emsp;&emsp;&emsp;<a name="DecimalIntegerLiteral-6d7b4e5f"></a>*[DecimalDigits](#DecimalDigits)*  
  
&emsp;&emsp;<a name="DecimalDigits"></a>*DecimalDigits* **:**  
&emsp;&emsp;&emsp;<a name="DecimalDigits-b3831ee0"></a>*[DecimalDigit](#DecimalDigit)*  
&emsp;&emsp;&emsp;<a name="DecimalDigits-9f250657"></a>*[DecimalDigits](#DecimalDigits)*&emsp;*[DecimalDigit](#DecimalDigit)*  
  
&emsp;&emsp;<a name="DecimalDigit"></a>*DecimalDigit* **:** **one of** `` 0 ``&emsp;`` 1 ``&emsp;`` 2 ``&emsp;`` 3 ``&emsp;`` 4 ``&emsp;`` 5 ``&emsp;`` 6 ``&emsp;`` 7 ``&emsp;`` 8 ``&emsp;`` 9 ``  
  
&emsp;&emsp;<a name="ExponentPart"></a>*ExponentPart* **:**  
&emsp;&emsp;&emsp;<a name="ExponentPart-7f837518"></a>*[ExponentIndicator](#ExponentIndicator)*&emsp;*[SignedInteger](#SignedInteger)*  
  
&emsp;&emsp;<a name="ExponentIndicator"></a>*ExponentIndicator* **:** **one of** `` e ``&emsp;`` E ``  
  
&emsp;&emsp;<a name="SignedInteger"></a>*SignedInteger* **:**  
&emsp;&emsp;&emsp;<a name="SignedInteger-6d7b4e5f"></a>*[DecimalDigits](#DecimalDigits)*  
&emsp;&emsp;&emsp;<a name="SignedInteger-3bd7fe57"></a>`` + ``&emsp;*[DecimalDigits](#DecimalDigits)*  
&emsp;&emsp;&emsp;<a name="SignedInteger-58000348"></a>`` - ``&emsp;*[DecimalDigits](#DecimalDigits)*  
  
&emsp;&emsp;<a name="HexIntegerLiteral"></a>*HexIntegerLiteral* **:**  
&emsp;&emsp;&emsp;<a name="HexIntegerLiteral-cf154180"></a>`` 0x ``&emsp;*[HexDigits](#HexDigits)*  
&emsp;&emsp;&emsp;<a name="HexIntegerLiteral-9ef756f3"></a>`` 0X ``&emsp;*[HexDigits](#HexDigits)*  
  
&emsp;&emsp;<a name="HexDigits"></a>*HexDigits* **:**  
&emsp;&emsp;&emsp;<a name="HexDigits-a0c48a71"></a>*[HexDigit](#HexDigit)*  
&emsp;&emsp;&emsp;<a name="HexDigits-c8221899"></a>*[HexDigits](#HexDigits)*&emsp;*[HexDigit](#HexDigit)*  
  
&emsp;&emsp;<a name="HexDigit"></a>*HexDigit* **:** **one of** `` 0 ``&emsp;`` 1 ``&emsp;`` 2 ``&emsp;`` 3 ``&emsp;`` 4 ``&emsp;`` 5 ``&emsp;`` 6 ``&emsp;`` 7 ``&emsp;`` 8 ``&emsp;`` 9 ``&emsp;`` a ``&emsp;`` b ``&emsp;`` c ``&emsp;`` d ``&emsp;`` e ``&emsp;`` f ``&emsp;`` A ``&emsp;`` B ``&emsp;`` C ``&emsp;`` D ``&emsp;`` E ``&emsp;`` F ``  
  
&emsp;&emsp;<a name="StringLiteral"></a>*StringLiteral* **:**  
&emsp;&emsp;&emsp;<a name="StringLiteral-82ecb3d9"></a>`` ' ``&emsp;*[SingleStringCharacters](#SingleStringCharacters)*<sub>opt</sub>&emsp;`` ' ``  
&emsp;&emsp;&emsp;<a name="StringLiteral-15d8b1f1"></a>`` " ``&emsp;*[DoubleStringCharacters](#DoubleStringCharacters)*<sub>opt</sub>&emsp;`` " ``  
&emsp;&emsp;&emsp;<a name="StringLiteral-01e5f820"></a>`` ` ``&emsp;*[BacktickStringCharacters](#BacktickStringCharacters)*<sub>opt</sub>&emsp;`` ` ``  
  
&emsp;&emsp;<a name="SingleStringCharacters"></a>*SingleStringCharacters* **:**  
&emsp;&emsp;&emsp;<a name="SingleStringCharacters-17d28457"></a>*[SingleStringCharacter](#SingleStringCharacter)*&emsp;*[SingleStringCharacters](#SingleStringCharacters)*<sub>opt</sub>  
  
&emsp;&emsp;<a name="SingleStringCharacter"></a>*SingleStringCharacter* **:**  
&emsp;&emsp;&emsp;<a name="SingleStringCharacter-20af69b8"></a>*[SourceCharacter](#SourceCharacter)* **but not** **one of** `` ' `` **or** `` \ ``  
&emsp;&emsp;&emsp;<a name="SingleStringCharacter-3b4c2a4a"></a>`` \ ``&emsp;*[EscapeCharacter](#EscapeCharacter)*  
  
&emsp;&emsp;<a name="DoubleStringCharacters"></a>*DoubleStringCharacters* **:**  
&emsp;&emsp;&emsp;<a name="DoubleStringCharacters-17d28457"></a>*[SingleStringCharacter](#SingleStringCharacter)*&emsp;*[SingleStringCharacters](#SingleStringCharacters)*<sub>opt</sub>  
  
&emsp;&emsp;<a name="DoubleStringCharacter"></a>*DoubleStringCharacter* **:**  
&emsp;&emsp;&emsp;<a name="DoubleStringCharacter-50b66e4c"></a>*[SourceCharacter](#SourceCharacter)* **but not** **one of** `` " `` **or** `` \ ``  
&emsp;&emsp;&emsp;<a name="DoubleStringCharacter-3b4c2a4a"></a>`` \ ``&emsp;*[EscapeCharacter](#EscapeCharacter)*  
  
&emsp;&emsp;<a name="BacktickStringCharacters"></a>*BacktickStringCharacters* **:**  
&emsp;&emsp;&emsp;<a name="BacktickStringCharacters-17d28457"></a>*[SingleStringCharacter](#SingleStringCharacter)*&emsp;*[SingleStringCharacters](#SingleStringCharacters)*<sub>opt</sub>  
  
&emsp;&emsp;<a name="BacktickStringCharacter"></a>*BacktickStringCharacter* **:**  
&emsp;&emsp;&emsp;<a name="BacktickStringCharacter-4610ad0d"></a>*[SourceCharacter](#SourceCharacter)* **but not** **one of** `` ` `` **or** `` \ ``  
&emsp;&emsp;&emsp;<a name="BacktickStringCharacter-3b4c2a4a"></a>`` \ ``&emsp;*[EscapeCharacter](#EscapeCharacter)*  
  
&emsp;&emsp;<a name="EscapeCharacter"></a>*EscapeCharacter* **:** **one of** `` ' ``&emsp;`` " ``&emsp;`` ` ``&emsp;`` r ``&emsp;`` n ``&emsp;`` t ``&emsp;`` \ ``  
  
&emsp;&emsp;<a name="Punctuator"></a>*Punctuator* **:** **one of** `` | ``&emsp;`` : ``&emsp;`` , ``&emsp;`` ; ``&emsp;`` . ``&emsp;`` < ``&emsp;`` > ``&emsp;`` ( ``&emsp;`` ) ``&emsp;`` { ``&emsp;`` } ``&emsp;`` [ ``&emsp;`` ] ``&emsp;`` @ ``&emsp;`` ... ``  
  
&emsp;&emsp;<a name="WhiteSpace"></a>*WhiteSpace* **:**  
&emsp;&emsp;&emsp;<a name="WhiteSpace-9384a802"></a>&lt;TAB&gt;  
&emsp;&emsp;&emsp;<a name="WhiteSpace-c3f7084f"></a>&lt;VT&gt;  
&emsp;&emsp;&emsp;<a name="WhiteSpace-0d57c596"></a>&lt;FF&gt;  
&emsp;&emsp;&emsp;<a name="WhiteSpace-d35745b8"></a>&lt;SP&gt;  
&emsp;&emsp;&emsp;<a name="WhiteSpace-404e9052"></a>&lt;NBSP&gt;  
&emsp;&emsp;&emsp;<a name="WhiteSpace-fb8196ba"></a>&lt;ZWNBSP&gt;  
&emsp;&emsp;&emsp;<a name="WhiteSpace-ebc9d288"></a>&lt;USP&gt;  
  
&emsp;&emsp;<a name="LineTerminator"></a>*LineTerminator* **:**  
&emsp;&emsp;&emsp;<a name="LineTerminator-7b39d525"></a>&lt;LF&gt;  
&emsp;&emsp;&emsp;<a name="LineTerminator-435c91d5"></a>&lt;CR&gt;  
&emsp;&emsp;&emsp;<a name="LineTerminator-10022ab3"></a>&lt;LS&gt;  
&emsp;&emsp;&emsp;<a name="LineTerminator-cfc875d1"></a>&lt;PS&gt;  
  
&emsp;&emsp;<a name="Comment"></a>*Comment* **:**  
&emsp;&emsp;&emsp;<a name="Comment-b221187a"></a>*[MultiLineComment](#MultiLineComment)*  
&emsp;&emsp;&emsp;<a name="Comment-49272b29"></a>*[SingleLineComment](#SingleLineComment)*  
  
&emsp;&emsp;<a name="MultiLineComment"></a>*MultiLineComment* **:**  
&emsp;&emsp;&emsp;<a name="MultiLineComment-1e164ceb"></a>`` /* ``&emsp;*[MultiLineCommentChars](#MultiLineCommentChars)*<sub>opt</sub>&emsp;`` */ ``  
  
&emsp;&emsp;<a name="MultiLineCommentChars"></a>*MultiLineCommentChars* **:**  
&emsp;&emsp;&emsp;<a name="MultiLineCommentChars-24a6effb"></a>*[MultiLineNotAsteriskChar](#MultiLineNotAsteriskChar)*&emsp;*[MultiLineCommentChars](#MultiLineCommentChars)*<sub>opt</sub>  
&emsp;&emsp;&emsp;<a name="MultiLineCommentChars-6fcb6b58"></a>`` * ``&emsp;*[PostAsteriskCommentChars](#PostAsteriskCommentChars)*<sub>opt</sub>  
  
&emsp;&emsp;<a name="PostAsteriskCommentChars"></a>*PostAsteriskCommentChars* **:**  
&emsp;&emsp;&emsp;<a name="PostAsteriskCommentChars-25615007"></a>*[MultiLineNotForwardSlashOrAsteriskChar](#MultiLineNotForwardSlashOrAsteriskChar)*&emsp;*[MultiLineCommentChars](#MultiLineCommentChars)*<sub>opt</sub>  
&emsp;&emsp;&emsp;<a name="PostAsteriskCommentChars-6fcb6b58"></a>`` * ``&emsp;*[PostAsteriskCommentChars](#PostAsteriskCommentChars)*<sub>opt</sub>  
  
&emsp;&emsp;<a name="MultiLineNotAsteriskChar"></a>*MultiLineNotAsteriskChar* **:**  
&emsp;&emsp;&emsp;<a name="MultiLineNotAsteriskChar-9452de17"></a>*[SourceCharacter](#SourceCharacter)* **but not** `` * ``  
  
&emsp;&emsp;<a name="MultiLineNotForwardSlashOrAsteriskChar"></a>*MultiLineNotForwardSlashOrAsteriskChar* **:**  
&emsp;&emsp;&emsp;<a name="MultiLineNotForwardSlashOrAsteriskChar-1dd7e7ae"></a>*[SourceCharacter](#SourceCharacter)* **but not** **one of** `` / `` **or** `` * ``  
  
&emsp;&emsp;<a name="SingleLineComment"></a>*SingleLineComment* **:**  
&emsp;&emsp;&emsp;<a name="SingleLineComment-53edd61c"></a>`` // ``&emsp;*[SingleLineCommentChars](#SingleLineCommentChars)*<sub>opt</sub>  
  
&emsp;&emsp;<a name="SingleLineCommentChars"></a>*SingleLineCommentChars* **:**  
&emsp;&emsp;&emsp;<a name="SingleLineCommentChars-4521d447"></a>*[SingleLineCommentChar](#SingleLineCommentChar)*&emsp;*[SingleLineCommentChars](#SingleLineCommentChars)*<sub>opt</sub>  
  
&emsp;&emsp;<a name="SingleLineCommentChar"></a>*SingleLineCommentChar* **:**  
&emsp;&emsp;&emsp;<a name="SingleLineCommentChar-2d5bdfa7"></a>*[SourceCharacter](#SourceCharacter)* **but not** *[LineTerminator](#LineTerminator)*  
  
&emsp;&emsp;<a name="ADLScript"></a>*ADLScript* **:**  
&emsp;&emsp;&emsp;<a name="ADLScript-a965a495"></a>*[StatementList](#StatementList)*<sub>opt</sub>  
  
&emsp;&emsp;<a name="StatementList"></a>*StatementList* **:**  
&emsp;&emsp;&emsp;<a name="StatementList-b12c8e45"></a>*[StatementList](#StatementList)*<sub>opt</sub>&emsp;*[Statement](#Statement)*  
  
&emsp;&emsp;<a name="Statement"></a>*Statement* **:**  
&emsp;&emsp;&emsp;<a name="Statement-648ff91f"></a>*[ImportStatement](#ImportStatement)*  
&emsp;&emsp;&emsp;<a name="Statement-0d99421b"></a>*[AliasStatement](#AliasStatement)*  
&emsp;&emsp;&emsp;<a name="Statement-3606dce2"></a>*[ModelStatement](#ModelStatement)*  
&emsp;&emsp;&emsp;<a name="Statement-a875a11d"></a>*[InterfaceStatement](#InterfaceStatement)*  
  
&emsp;&emsp;<a name="ImportStatement"></a>*ImportStatement* **:**  
&emsp;&emsp;&emsp;<a name="ImportStatement-fdc92c39"></a>`` import ``&emsp;*[Identifier](#Identifier)*&emsp;`` ; ``  
&emsp;&emsp;&emsp;<a name="ImportStatement-bf59223f"></a>`` import ``&emsp;*[Identifier](#Identifier)*&emsp;`` as ``&emsp;`` { ``&emsp;*[NamedImports](#NamedImports)*<sub>opt</sub>&emsp;`` } ``&emsp;`` ; ``  
  
&emsp;&emsp;<a name="NamedImports"></a>*NamedImports* **:**  
&emsp;&emsp;&emsp;<a name="NamedImports-06b6ace8"></a>*[Identifier](#Identifier)*  
&emsp;&emsp;&emsp;<a name="NamedImports-02b3b1dc"></a>*[NamedImports](#NamedImports)*&emsp;`` , ``&emsp;*[Identifier](#Identifier)*  
  
&emsp;&emsp;<a name="AliasStatement"></a>*AliasStatement* **:**  
&emsp;&emsp;&emsp;<a name="AliasStatement-d918b509"></a>`` alias ``&emsp;*[Identifier](#Identifier)*&emsp;`` : ``&emsp;*[Expression](#Expression)*&emsp;`` ; ``  
  
&emsp;&emsp;<a name="ModelStatement"></a>*ModelStatement* **:**  
&emsp;&emsp;&emsp;<a name="ModelStatement-b7b1d16b"></a>*[DecoratorList](#DecoratorList)*<sub>opt</sub>&emsp;`` model ``&emsp;*[Identifier](#Identifier)*&emsp;`` { ``&emsp;*[ModelBody](#ModelBody)*<sub>opt</sub>&emsp;`` } ``  
&emsp;&emsp;&emsp;<a name="ModelStatement-a9aaf94c"></a>*[DecoratorList](#DecoratorList)*<sub>opt</sub>&emsp;`` model ``&emsp;*[Identifier](#Identifier)*&emsp;`` = ``&emsp;*[Expression](#Expression)*&emsp;`` ; ``  
  
&emsp;&emsp;<a name="ModelBody"></a>*ModelBody* **:**  
&emsp;&emsp;&emsp;<a name="ModelBody-9c3eec1f"></a>*[ModelPropertyList](#ModelPropertyList)*&emsp;`` , ``<sub>opt</sub>  
&emsp;&emsp;&emsp;<a name="ModelBody-f83532f2"></a>*[ModelPropertyList](#ModelPropertyList)*&emsp;`` ; ``<sub>opt</sub>  
  
&emsp;&emsp;<a name="ModelPropertyList"></a>*ModelPropertyList* **:**  
&emsp;&emsp;&emsp;<a name="ModelPropertyList-187399ec"></a>*[ModelProperty](#ModelProperty)*  
&emsp;&emsp;&emsp;<a name="ModelPropertyList-bdff53cc"></a>*[ModelPropertyList](#ModelPropertyList)*&emsp;`` , ``&emsp;*[ModelProperty](#ModelProperty)*  
&emsp;&emsp;&emsp;<a name="ModelPropertyList-9731b26d"></a>*[ModelPropertyList](#ModelPropertyList)*&emsp;`` ; ``&emsp;*[ModelProperty](#ModelProperty)*  
  
&emsp;&emsp;<a name="ModelProperty"></a>*ModelProperty* **:**  
&emsp;&emsp;&emsp;<a name="ModelProperty-18804a23"></a>*[ModelSpreadProperty](#ModelSpreadProperty)*  
&emsp;&emsp;&emsp;<a name="ModelProperty-87d190a4"></a>*[DecoratorList](#DecoratorList)*<sub>opt</sub>&emsp;*[Identifier](#Identifier)*&emsp;`` : ``&emsp;*[Expression](#Expression)*  
&emsp;&emsp;&emsp;<a name="ModelProperty-d8c842ba"></a>*[DecoratorList](#DecoratorList)*<sub>opt</sub>&emsp;*[StringLiteral](#StringLiteral)*&emsp;`` : ``&emsp;*[Expression](#Expression)*  
  
&emsp;&emsp;<a name="ModelSpreadProperty"></a>*ModelSpreadProperty* **:**  
&emsp;&emsp;&emsp;<a name="ModelSpreadProperty-ba1e81db"></a>`` ... ``&emsp;*[Identifier](#Identifier)*  
  
&emsp;&emsp;<a name="InterfaceStatement"></a>*InterfaceStatement* **:**  
&emsp;&emsp;&emsp;<a name="InterfaceStatement-d483a1e3"></a>*[DecoratorList](#DecoratorList)*<sub>opt</sub>&emsp;`` interface ``&emsp;*[Identifier](#Identifier)*&emsp;`` { ``&emsp;*[InterfaceBody](#InterfaceBody)*<sub>opt</sub>&emsp;`` } ``  
  
&emsp;&emsp;<a name="InterfaceBody"></a>*InterfaceBody* **:**  
&emsp;&emsp;&emsp;<a name="InterfaceBody-42db29a8"></a>*[InterfacePropertyList](#InterfacePropertyList)*&emsp;`` , ``<sub>opt</sub>  
&emsp;&emsp;&emsp;<a name="InterfaceBody-3356a474"></a>*[InterfacePropertyList](#InterfacePropertyList)*&emsp;`` ; ``<sub>opt</sub>  
  
&emsp;&emsp;<a name="InterfacePropertyList"></a>*InterfacePropertyList* **:**  
&emsp;&emsp;&emsp;<a name="InterfacePropertyList-4b6e0e43"></a>*[InterfaceProperty](#InterfaceProperty)*  
&emsp;&emsp;&emsp;<a name="InterfacePropertyList-7a4ddc85"></a>*[InterfacePropertyList](#InterfacePropertyList)*&emsp;`` , ``&emsp;*[InterfaceProperty](#InterfaceProperty)*  
&emsp;&emsp;&emsp;<a name="InterfacePropertyList-f364599f"></a>*[InterfacePropertyList](#InterfacePropertyList)*&emsp;`` ; ``&emsp;*[InterfaceProperty](#InterfaceProperty)*  
  
&emsp;&emsp;<a name="InterfaceProperty"></a>*InterfaceProperty* **:**  
&emsp;&emsp;&emsp;<a name="InterfaceProperty-6e1a4442"></a>*[DecoratorList](#DecoratorList)*<sub>opt</sub>&emsp;*[Identifier](#Identifier)*&emsp;`` ( ``&emsp;*[ModelPropertyList](#ModelPropertyList)*<sub>opt</sub>&emsp;`` ) ``&emsp;`` : ``&emsp;*[Expression](#Expression)*  
  
&emsp;&emsp;<a name="Expression"></a>*Expression* **:**  
&emsp;&emsp;&emsp;<a name="Expression-fa1e582c"></a>*[UnionExpression](#UnionExpression)*  
  
&emsp;&emsp;<a name="UnionExpression"></a>*UnionExpression* **:**  
&emsp;&emsp;&emsp;<a name="UnionExpression-1452543c"></a>*[IntersectionExpression](#IntersectionExpression)*  
&emsp;&emsp;&emsp;<a name="UnionExpression-06f68107"></a>*[UnionExpression](#UnionExpression)*&emsp;`` | ``&emsp;*[IntersectionExpression](#IntersectionExpression)*  
  
&emsp;&emsp;<a name="IntersectionExpression"></a>*IntersectionExpression* **:**  
&emsp;&emsp;&emsp;<a name="IntersectionExpression-73ef048c"></a>*[ArrayExpression](#ArrayExpression)*  
&emsp;&emsp;&emsp;<a name="IntersectionExpression-0bde1aaa"></a>*[IntersectionExpression](#IntersectionExpression)*&emsp;`` & ``&emsp;*[ArrayExpression](#ArrayExpression)*  
  
&emsp;&emsp;<a name="ArrayExpression"></a>*ArrayExpression* **:**  
&emsp;&emsp;&emsp;<a name="ArrayExpression-c43ff850"></a>*[TemplateApplication](#TemplateApplication)*  
&emsp;&emsp;&emsp;<a name="ArrayExpression-9ac715e5"></a>*[TemplateApplication](#TemplateApplication)*&emsp;`` [ ``&emsp;`` ] ``  
  
&emsp;&emsp;<a name="TemplateApplication"></a>*TemplateApplication* **:**  
&emsp;&emsp;&emsp;<a name="TemplateApplication-08da2001"></a>*[MemberExpression](#MemberExpression)*  
&emsp;&emsp;&emsp;<a name="TemplateApplication-769a76c5"></a>*[MemberExpression](#MemberExpression)*&emsp;`` < ``&emsp;*[ExpressionList](#ExpressionList)*&emsp;`` > ``  
  
&emsp;&emsp;<a name="MemberExpression"></a>*MemberExpression* **:**  
&emsp;&emsp;&emsp;<a name="MemberExpression-8ef72f7a"></a>*[PrimaryExpression](#PrimaryExpression)*  
&emsp;&emsp;&emsp;<a name="MemberExpression-b6748983"></a>*[MemberExpression](#MemberExpression)*&emsp;`` . ``&emsp;*[Identifier](#Identifier)*  
  
&emsp;&emsp;<a name="PrimaryExpression"></a>*PrimaryExpression* **:**  
&emsp;&emsp;&emsp;<a name="PrimaryExpression-06b6ace8"></a>*[Identifier](#Identifier)*  
&emsp;&emsp;&emsp;<a name="PrimaryExpression-92e97e03"></a>*[Literal](#Literal)*  
&emsp;&emsp;&emsp;<a name="PrimaryExpression-0f4d3b14"></a>*[ModelExpression](#ModelExpression)*  
&emsp;&emsp;&emsp;<a name="PrimaryExpression-44c0a29c"></a>*[TupleExpression](#TupleExpression)*  
  
&emsp;&emsp;<a name="Literal"></a>*Literal* **:**  
&emsp;&emsp;&emsp;<a name="Literal-5c74e54d"></a>*[StringLiteral](#StringLiteral)*  
&emsp;&emsp;&emsp;<a name="Literal-3508e1fd"></a>*[BooleanLiteral](#BooleanLiteral)*  
&emsp;&emsp;&emsp;<a name="Literal-a548b407"></a>*[NumericLiteral](#NumericLiteral)*  
  
&emsp;&emsp;<a name="ModelExpression"></a>*ModelExpression* **:**  
&emsp;&emsp;&emsp;<a name="ModelExpression-a7d4ad54"></a>`` { ``&emsp;*[ModelBody](#ModelBody)*<sub>opt</sub>&emsp;`` } ``  
  
&emsp;&emsp;<a name="TupleExpression"></a>*TupleExpression* **:**  
&emsp;&emsp;&emsp;<a name="TupleExpression-9824fa78"></a>`` [ ``&emsp;*[ExpressionList](#ExpressionList)*&emsp;`` ] ``  
  
&emsp;&emsp;<a name="ExpressionList"></a>*ExpressionList* **:**  
&emsp;&emsp;&emsp;<a name="ExpressionList-97b695b9"></a>*[Expression](#Expression)*  
&emsp;&emsp;&emsp;<a name="ExpressionList-f026cc63"></a>*[ExpressionList](#ExpressionList)*&emsp;`` , ``&emsp;*[Expression](#Expression)*  
  
&emsp;&emsp;<a name="DecoratorList"></a>*DecoratorList* **:**  
&emsp;&emsp;&emsp;<a name="DecoratorList-6ba16f86"></a>*[DecoratorList](#DecoratorList)*<sub>opt</sub>&emsp;*[Decorator](#Decorator)*  
  
&emsp;&emsp;<a name="Decorator"></a>*Decorator* **:**  
&emsp;&emsp;&emsp;<a name="Decorator-77540820"></a>`` @ ``&emsp;*[MemberExpression](#MemberExpression)*&emsp;*[DecoratorArguments](#DecoratorArguments)*<sub>opt</sub>  
&emsp;&emsp;&emsp;<a name="Decorator-bc994750"></a>`` [ ``&emsp;*[MemberExpression](#MemberExpression)*&emsp;*[DecoratorArguments](#DecoratorArguments)*<sub>opt</sub>&emsp;`` ] ``  
  
&emsp;&emsp;<a name="DecoratorArguments"></a>*DecoratorArguments* **:**  
&emsp;&emsp;&emsp;<a name="DecoratorArguments-92e97e03"></a>*[Literal](#Literal)*  
&emsp;&emsp;&emsp;<a name="DecoratorArguments-810ea32d"></a>`` ( ``&emsp;*[ExpressionList](#ExpressionList)*<sub>opt</sub>&emsp;`` ) ``  
  
