&emsp;&emsp;<a name="SourceCharacter"></a>*SourceCharacter* **:**  
&emsp;&emsp;&emsp;<a name="SourceCharacter-xks4vqzw"></a>any Unicode code point  
  
&emsp;&emsp;<a name="InputElement"></a>*InputElement* **:**  
&emsp;&emsp;&emsp;<a name="InputElement-orqeuwg2"></a>*[Token](#Token)*  
&emsp;&emsp;&emsp;<a name="InputElement-kg5yghiq"></a>*[Trivia](#Trivia)*  
  
&emsp;&emsp;<a name="Token"></a>*Token* **:**  
&emsp;&emsp;&emsp;<a name="Token-o5jua5_x"></a>*[Keyword](#Keyword)*  
&emsp;&emsp;&emsp;<a name="Token-bras6mo_"></a>*[Identifier](#Identifier)*  
&emsp;&emsp;&emsp;<a name="Token-pui0b1rt"></a>*[NumericLiteral](#NumericLiteral)*  
&emsp;&emsp;&emsp;<a name="Token-xhtltz00"></a>*[StringLiteral](#StringLiteral)*  
&emsp;&emsp;&emsp;<a name="Token-7hjz1m8p"></a>*[Punctuator](#Punctuator)*  
  
&emsp;&emsp;<a name="Trivia"></a>*Trivia* **:**  
&emsp;&emsp;&emsp;<a name="Trivia-ft16wloj"></a>*[Comment](#Comment)*  
&emsp;&emsp;&emsp;<a name="Trivia-fctcswat"></a>*[WhiteSpace](#WhiteSpace)*  
&emsp;&emsp;&emsp;<a name="Trivia-ozmczrck"></a>*[LineTerminator](#LineTerminator)*  
  
&emsp;&emsp;<a name="Keyword"></a>*Keyword* **:**  
&emsp;&emsp;&emsp;<a name="Keyword-nqjh_sxl"></a>*[BooleanLiteral](#BooleanLiteral)*  
&emsp;&emsp;&emsp;<a name="Keyword-azcs9apw"></a>`` import ``  
&emsp;&emsp;&emsp;<a name="Keyword--mdwbm0b"></a>`` model ``  
&emsp;&emsp;&emsp;<a name="Keyword-lpev-y-g"></a>`` namespace ``  
&emsp;&emsp;&emsp;<a name="Keyword-ytodrzn0"></a>`` op ``  
  
&emsp;&emsp;<a name="Identifier"></a>*Identifier* **:**  
&emsp;&emsp;&emsp;<a name="Identifier-exwdmcdi"></a>*[IdentifierName](#IdentifierName)* **but not** *[Keyword](#Keyword)*  
  
&emsp;&emsp;<a name="IdentifierName"></a>*IdentifierName* **:**  
&emsp;&emsp;&emsp;<a name="IdentifierName-q0afq8g8"></a>*[IdentifierStart](#IdentifierStart)*  
&emsp;&emsp;&emsp;<a name="IdentifierName-amguopqs"></a>*[IdentifierName](#IdentifierName)*&emsp;*[IdentifierContinue](#IdentifierContinue)*  
  
&emsp;&emsp;<a name="IdentifierStart"></a>*IdentifierStart* **:**  
&emsp;&emsp;&emsp;<a name="IdentifierStart-0uivrwr2"></a>any Unicode code point with the Unicode property "ID_Start" or "Other_ID_Start"  
&emsp;&emsp;&emsp;<a name="IdentifierStart-emlmkqfm"></a>`` $ ``  
&emsp;&emsp;&emsp;<a name="IdentifierStart-b1zllonv"></a>`` _ ``  
  
&emsp;&emsp;<a name="IdentifierContinue"></a>*IdentifierContinue* **:**  
&emsp;&emsp;&emsp;<a name="IdentifierContinue-dc1rjkto"></a>any Unicode code point with the Unicode property "ID_Continue" or "Other_ID_Continue", or "Other_ID_Start"  
&emsp;&emsp;&emsp;<a name="IdentifierContinue-emlmkqfm"></a>`` $ ``  
&emsp;&emsp;&emsp;<a name="IdentifierContinue-b1zllonv"></a>`` _ ``  
&emsp;&emsp;&emsp;<a name="IdentifierContinue-ynldexir"></a>&lt;ZWNJ&gt;  
&emsp;&emsp;&emsp;<a name="IdentifierContinue-zfgp9vws"></a>&lt;ZWJ&gt;  
  
&emsp;&emsp;<a name="BooleanLiteral"></a>*BooleanLiteral* **:**  
&emsp;&emsp;&emsp;<a name="BooleanLiteral--jc4xg27"></a>`` true ``  
&emsp;&emsp;&emsp;<a name="BooleanLiteral-i9lgnxtt"></a>`` false ``  
  
&emsp;&emsp;<a name="NumericLiteral"></a>*NumericLiteral* **:**  
&emsp;&emsp;&emsp;<a name="NumericLiteral-gma1bw5s"></a>*[DecimalLiteral](#DecimalLiteral)*  
&emsp;&emsp;&emsp;<a name="NumericLiteral-hqxkzjla"></a>*[HexIntegerLiteral](#HexIntegerLiteral)*  
  
&emsp;&emsp;<a name="DecimalLiteral"></a>*DecimalLiteral* **:**  
&emsp;&emsp;&emsp;<a name="DecimalLiteral--1gypvbs"></a>*[DecimalIntegerLiteral](#DecimalIntegerLiteral)*&emsp;`` . ``&emsp;*[DecimalDigits](#DecimalDigits)*<sub>opt</sub>&emsp;*[ExponentPart](#ExponentPart)*<sub>opt</sub>  
&emsp;&emsp;&emsp;<a name="DecimalLiteral-e9uvir9w"></a>*[DecimalIntegerLiteral](#DecimalIntegerLiteral)*&emsp;*[ExponentPart](#ExponentPart)*<sub>opt</sub>  
  
&emsp;&emsp;<a name="DecimalIntegerLiteral"></a>*DecimalIntegerLiteral* **:**  
&emsp;&emsp;&emsp;<a name="DecimalIntegerLiteral-bxtox5eb"></a>*[DecimalDigits](#DecimalDigits)*  
  
&emsp;&emsp;<a name="DecimalDigits"></a>*DecimalDigits* **:**  
&emsp;&emsp;&emsp;<a name="DecimalDigits-s4me4hlz"></a>*[DecimalDigit](#DecimalDigit)*  
&emsp;&emsp;&emsp;<a name="DecimalDigits-nyugv7lw"></a>*[DecimalDigits](#DecimalDigits)*&emsp;*[DecimalDigit](#DecimalDigit)*  
  
&emsp;&emsp;<a name="DecimalDigit"></a>*DecimalDigit* **:** **one of** `` 0 ``&emsp;`` 1 ``&emsp;`` 2 ``&emsp;`` 3 ``&emsp;`` 4 ``&emsp;`` 5 ``&emsp;`` 6 ``&emsp;`` 7 ``&emsp;`` 8 ``&emsp;`` 9 ``  
  
&emsp;&emsp;<a name="ExponentPart"></a>*ExponentPart* **:**  
&emsp;&emsp;&emsp;<a name="ExponentPart--i6y2ihv"></a>`` e ``&emsp;*[SignedInteger](#SignedInteger)*  
  
&emsp;&emsp;<a name="SignedInteger"></a>*SignedInteger* **:**  
&emsp;&emsp;&emsp;<a name="SignedInteger-bxtox5eb"></a>*[DecimalDigits](#DecimalDigits)*  
&emsp;&emsp;&emsp;<a name="SignedInteger-o9f-v3mh"></a>`` + ``&emsp;*[DecimalDigits](#DecimalDigits)*  
&emsp;&emsp;&emsp;<a name="SignedInteger-waadsnwo"></a>`` - ``&emsp;*[DecimalDigits](#DecimalDigits)*  
  
&emsp;&emsp;<a name="HexIntegerLiteral"></a>*HexIntegerLiteral* **:**  
&emsp;&emsp;&emsp;<a name="HexIntegerLiteral-zxvbgn4l"></a>`` 0x ``&emsp;*[HexDigits](#HexDigits)*  
  
&emsp;&emsp;<a name="HexDigits"></a>*HexDigits* **:**  
&emsp;&emsp;&emsp;<a name="HexDigits-omskcs0d"></a>*[HexDigit](#HexDigit)*  
&emsp;&emsp;&emsp;<a name="HexDigits-yciymy2l"></a>*[HexDigits](#HexDigits)*&emsp;*[HexDigit](#HexDigit)*  
  
&emsp;&emsp;<a name="HexDigit"></a>*HexDigit* **:** **one of** `` 0 ``&emsp;`` 1 ``&emsp;`` 2 ``&emsp;`` 3 ``&emsp;`` 4 ``&emsp;`` 5 ``&emsp;`` 6 ``&emsp;`` 7 ``&emsp;`` 8 ``&emsp;`` 9 ``&emsp;`` a ``&emsp;`` b ``&emsp;`` c ``&emsp;`` d ``&emsp;`` e ``&emsp;`` f ``&emsp;`` A ``&emsp;`` B ``&emsp;`` C ``&emsp;`` D ``&emsp;`` E ``&emsp;`` F ``  
  
&emsp;&emsp;<a name="BinaryIntegerLiteral"></a>*BinaryIntegerLiteral* **:**  
&emsp;&emsp;&emsp;<a name="BinaryIntegerLiteral-ya14f57w"></a>`` 0b ``&emsp;*[BinaryDigits](#BinaryDigits)*  
  
&emsp;&emsp;<a name="BinaryDigits"></a>*BinaryDigits* **:**  
&emsp;&emsp;&emsp;<a name="BinaryDigits-5fhui2lc"></a>*[BinaryDigit](#BinaryDigit)*  
&emsp;&emsp;&emsp;<a name="BinaryDigits-gqp0qw4u"></a>*[BinaryDigits](#BinaryDigits)*&emsp;*[BinaryDigit](#BinaryDigit)*  
  
&emsp;&emsp;<a name="BinaryDigit"></a>*BinaryDigit* **:** **one of** `` 0 ``&emsp;`` 1 ``  
  
&emsp;&emsp;<a name="StringLiteral"></a>*StringLiteral* **:**  
&emsp;&emsp;&emsp;<a name="StringLiteral-vxwiv5cv"></a>`` " ``&emsp;*[StringCharacters](#StringCharacters)*<sub>opt</sub>&emsp;`` " ``  
  
&emsp;&emsp;<a name="StringCharacters"></a>*StringCharacters* **:**  
&emsp;&emsp;&emsp;<a name="StringCharacters-dwizkn7f"></a>*[StringCharacter](#StringCharacter)*&emsp;*[StringCharacters](#StringCharacters)*<sub>opt</sub>  
  
&emsp;&emsp;<a name="StringCharacter"></a>*StringCharacter* **:**  
&emsp;&emsp;&emsp;<a name="StringCharacter-ulzuti3k"></a>*[SourceCharacter](#SourceCharacter)* **but not** **one of** `` " `` **or** `` \ ``  
&emsp;&emsp;&emsp;<a name="StringCharacter-o0wqskax"></a>`` \ ``&emsp;*[EscapeCharacter](#EscapeCharacter)*  
  
&emsp;&emsp;<a name="EscapeCharacter"></a>*EscapeCharacter* **:** **one of** `` " ``&emsp;`` r ``&emsp;`` n ``&emsp;`` t ``&emsp;`` \ ``  
  
&emsp;&emsp;<a name="Punctuator"></a>*Punctuator* **:** **one of** `` | ``&emsp;`` ? ``&emsp;`` = ``&emsp;`` & ``&emsp;`` : ``&emsp;`` , ``&emsp;`` ; ``&emsp;`` . ``&emsp;`` < ``&emsp;`` > ``&emsp;`` ( ``&emsp;`` ) ``&emsp;`` { ``&emsp;`` } ``&emsp;`` [ ``&emsp;`` ] ``&emsp;`` @ ``&emsp;`` ... ``  
  
&emsp;&emsp;<a name="WhiteSpace"></a>*WhiteSpace* **:**  
&emsp;&emsp;&emsp;<a name="WhiteSpace-k4soaizl"></a>&lt;TAB&gt;  
&emsp;&emsp;&emsp;<a name="WhiteSpace-w_cit1lu"></a>&lt;VT&gt;  
&emsp;&emsp;&emsp;<a name="WhiteSpace-dvfflmsr"></a>&lt;FF&gt;  
&emsp;&emsp;&emsp;<a name="WhiteSpace-01dfufyk"></a>&lt;SP&gt;  
&emsp;&emsp;&emsp;<a name="WhiteSpace-qe6qukax"></a>&lt;NBSP&gt;  
&emsp;&emsp;&emsp;<a name="WhiteSpace--4gwujcl"></a>&lt;ZWNBSP&gt;  
&emsp;&emsp;&emsp;<a name="WhiteSpace-68nsiosh"></a>&lt;USP&gt;  
  
&emsp;&emsp;<a name="LineTerminator"></a>*LineTerminator* **:**  
&emsp;&emsp;&emsp;<a name="LineTerminator-eznvjwhz"></a>&lt;LF&gt;  
&emsp;&emsp;&emsp;<a name="LineTerminator-q1yr1eki"></a>&lt;CR&gt;  
&emsp;&emsp;&emsp;<a name="LineTerminator-eaiqsw9w"></a>&lt;LS&gt;  
&emsp;&emsp;&emsp;<a name="LineTerminator-z8h10fxn"></a>&lt;PS&gt;  
  
&emsp;&emsp;<a name="Comment"></a>*Comment* **:**  
&emsp;&emsp;&emsp;<a name="Comment-sieyeref"></a>*[MultiLineComment](#MultiLineComment)*  
&emsp;&emsp;&emsp;<a name="Comment-sscrkqcd"></a>*[SingleLineComment](#SingleLineComment)*  
  
&emsp;&emsp;<a name="MultiLineComment"></a>*MultiLineComment* **:**  
&emsp;&emsp;&emsp;<a name="MultiLineComment-hhzm60cr"></a>`` /* ``&emsp;*[MultiLineCommentChars](#MultiLineCommentChars)*<sub>opt</sub>&emsp;`` */ ``  
  
&emsp;&emsp;<a name="MultiLineCommentChars"></a>*MultiLineCommentChars* **:**  
&emsp;&emsp;&emsp;<a name="MultiLineCommentChars-jkbv-8n6"></a>*[MultiLineNotAsteriskChar](#MultiLineNotAsteriskChar)*&emsp;*[MultiLineCommentChars](#MultiLineCommentChars)*<sub>opt</sub>  
&emsp;&emsp;&emsp;<a name="MultiLineCommentChars-b8trwjej"></a>`` * ``&emsp;*[PostAsteriskCommentChars](#PostAsteriskCommentChars)*<sub>opt</sub>  
  
&emsp;&emsp;<a name="PostAsteriskCommentChars"></a>*PostAsteriskCommentChars* **:**  
&emsp;&emsp;&emsp;<a name="PostAsteriskCommentChars-jwfqbwpm"></a>*[MultiLineNotForwardSlashOrAsteriskChar](#MultiLineNotForwardSlashOrAsteriskChar)*&emsp;*[MultiLineCommentChars](#MultiLineCommentChars)*<sub>opt</sub>  
&emsp;&emsp;&emsp;<a name="PostAsteriskCommentChars-b8trwjej"></a>`` * ``&emsp;*[PostAsteriskCommentChars](#PostAsteriskCommentChars)*<sub>opt</sub>  
  
&emsp;&emsp;<a name="MultiLineNotAsteriskChar"></a>*MultiLineNotAsteriskChar* **:**  
&emsp;&emsp;&emsp;<a name="MultiLineNotAsteriskChar-lflef8ko"></a>*[SourceCharacter](#SourceCharacter)* **but not** `` * ``  
  
&emsp;&emsp;<a name="MultiLineNotForwardSlashOrAsteriskChar"></a>*MultiLineNotForwardSlashOrAsteriskChar* **:**  
&emsp;&emsp;&emsp;<a name="MultiLineNotForwardSlashOrAsteriskChar-hdfnrv5z"></a>*[SourceCharacter](#SourceCharacter)* **but not** **one of** `` / `` **or** `` * ``  
  
&emsp;&emsp;<a name="SingleLineComment"></a>*SingleLineComment* **:**  
&emsp;&emsp;&emsp;<a name="SingleLineComment-u-3whel6"></a>`` // ``&emsp;*[SingleLineCommentChars](#SingleLineCommentChars)*<sub>opt</sub>  
  
&emsp;&emsp;<a name="SingleLineCommentChars"></a>*SingleLineCommentChars* **:**  
&emsp;&emsp;&emsp;<a name="SingleLineCommentChars-rshuryvh"></a>*[SingleLineCommentChar](#SingleLineCommentChar)*&emsp;*[SingleLineCommentChars](#SingleLineCommentChars)*<sub>opt</sub>  
  
&emsp;&emsp;<a name="SingleLineCommentChar"></a>*SingleLineCommentChar* **:**  
&emsp;&emsp;&emsp;<a name="SingleLineCommentChar-lvvfp8iw"></a>*[SourceCharacter](#SourceCharacter)* **but not** *[LineTerminator](#LineTerminator)*  
  
&emsp;&emsp;<a name="ADLScript"></a>*ADLScript* **:**  
&emsp;&emsp;&emsp;<a name="ADLScript-qwwklbsn"></a>*[StatementList](#StatementList)*<sub>opt</sub>  
  
&emsp;&emsp;<a name="StatementList"></a>*StatementList* **:**  
&emsp;&emsp;&emsp;<a name="StatementList-ssyorrl_"></a>*[StatementList](#StatementList)*<sub>opt</sub>&emsp;*[Statement](#Statement)*  
  
&emsp;&emsp;<a name="Statement"></a>*Statement* **:**  
&emsp;&emsp;&emsp;<a name="Statement-zi_5hwi0"></a>*[ImportStatement](#ImportStatement)*  
&emsp;&emsp;&emsp;<a name="Statement-ngbc4m7o"></a>*[ModelStatement](#ModelStatement)*  
&emsp;&emsp;&emsp;<a name="Statement-_ljtj5og"></a>*[NamespaceStatement](#NamespaceStatement)*  
&emsp;&emsp;&emsp;<a name="Statement-sg2sawim"></a>`` ; ``  
  
&emsp;&emsp;<a name="ImportStatement"></a>*ImportStatement* **:**  
&emsp;&emsp;&emsp;<a name="ImportStatement-_cksowvz"></a>`` import ``&emsp;*[Identifier](#Identifier)*&emsp;`` ; ``  
&emsp;&emsp;&emsp;<a name="ImportStatement-v1kip791"></a>`` import ``&emsp;*[Identifier](#Identifier)*&emsp;`` as ``&emsp;`` { ``&emsp;*[NamedImports](#NamedImports)*<sub>opt</sub>&emsp;`` } ``&emsp;`` ; ``  
  
&emsp;&emsp;<a name="NamedImports"></a>*NamedImports* **:**  
&emsp;&emsp;&emsp;<a name="NamedImports-bras6mo_"></a>*[Identifier](#Identifier)*  
&emsp;&emsp;&emsp;<a name="NamedImports-arox3l8x"></a>*[NamedImports](#NamedImports)*&emsp;`` , ``&emsp;*[Identifier](#Identifier)*  
  
&emsp;&emsp;<a name="ModelStatement"></a>*ModelStatement* **:**  
&emsp;&emsp;&emsp;<a name="ModelStatement-8hqza0pe"></a>*[DecoratorList](#DecoratorList)*<sub>opt</sub>&emsp;`` model ``&emsp;*[Identifier](#Identifier)*&emsp;*[TemplateParameters](#TemplateParameters)*<sub>opt</sub>&emsp;`` { ``&emsp;*[ModelBody](#ModelBody)*<sub>opt</sub>&emsp;`` } ``  
&emsp;&emsp;&emsp;<a name="ModelStatement-gvibrs-4"></a>*[DecoratorList](#DecoratorList)*<sub>opt</sub>&emsp;`` model ``&emsp;*[Identifier](#Identifier)*&emsp;*[TemplateParameters](#TemplateParameters)*<sub>opt</sub>&emsp;`` = ``&emsp;*[Expression](#Expression)*&emsp;`` ; ``  
  
&emsp;&emsp;<a name="TemplateParameters"></a>*TemplateParameters* **:**  
&emsp;&emsp;&emsp;<a name="TemplateParameters-m5tcjdl1"></a>`` < ``&emsp;*[IdentifierList](#IdentifierList)*&emsp;`` > ``  
  
&emsp;&emsp;<a name="IdentifierList"></a>*IdentifierList* **:**  
&emsp;&emsp;&emsp;<a name="IdentifierList-bras6mo_"></a>*[Identifier](#Identifier)*  
&emsp;&emsp;&emsp;<a name="IdentifierList-btxjxlll"></a>*[IdentifierList](#IdentifierList)*&emsp;`` , ``&emsp;*[Identifier](#Identifier)*  
  
&emsp;&emsp;<a name="ModelBody"></a>*ModelBody* **:**  
&emsp;&emsp;&emsp;<a name="ModelBody-nd7shwc0"></a>*[ModelPropertyList](#ModelPropertyList)*&emsp;`` , ``<sub>opt</sub>  
&emsp;&emsp;&emsp;<a name="ModelBody--duy8rb1"></a>*[ModelPropertyList](#ModelPropertyList)*&emsp;`` ; ``<sub>opt</sub>  
  
&emsp;&emsp;<a name="ModelPropertyList"></a>*ModelPropertyList* **:**  
&emsp;&emsp;&emsp;<a name="ModelPropertyList-ghoz7lyz"></a>*[ModelProperty](#ModelProperty)*  
&emsp;&emsp;&emsp;<a name="ModelPropertyList-vf9tzeyl"></a>*[ModelPropertyList](#ModelPropertyList)*&emsp;`` , ``&emsp;*[ModelProperty](#ModelProperty)*  
&emsp;&emsp;&emsp;<a name="ModelPropertyList-lzgybwma"></a>*[ModelPropertyList](#ModelPropertyList)*&emsp;`` ; ``&emsp;*[ModelProperty](#ModelProperty)*  
  
&emsp;&emsp;<a name="ModelProperty"></a>*ModelProperty* **:**  
&emsp;&emsp;&emsp;<a name="ModelProperty-gibki9cu"></a>*[ModelSpreadProperty](#ModelSpreadProperty)*  
&emsp;&emsp;&emsp;<a name="ModelProperty-77nrmgnp"></a>*[DecoratorList](#DecoratorList)*<sub>opt</sub>&emsp;*[Identifier](#Identifier)*&emsp;`` ? ``<sub>opt</sub>&emsp;`` : ``&emsp;*[Expression](#Expression)*  
&emsp;&emsp;&emsp;<a name="ModelProperty-vmgvgt2o"></a>*[DecoratorList](#DecoratorList)*<sub>opt</sub>&emsp;*[StringLiteral](#StringLiteral)*&emsp;`` ? ``<sub>opt</sub>&emsp;`` : ``&emsp;*[Expression](#Expression)*  
  
&emsp;&emsp;<a name="ModelSpreadProperty"></a>*ModelSpreadProperty* **:**  
&emsp;&emsp;&emsp;<a name="ModelSpreadProperty-uh6b21ad"></a>`` ... ``&emsp;*[Identifier](#Identifier)*  
  
&emsp;&emsp;<a name="NamespaceStatement"></a>*NamespaceStatement* **:**  
&emsp;&emsp;&emsp;<a name="NamespaceStatement-lllfloam"></a>*[DecoratorList](#DecoratorList)*<sub>opt</sub>&emsp;`` namespace ``&emsp;*[Identifier](#Identifier)*&emsp;`` { ``&emsp;*[NamespaceBody](#NamespaceBody)*<sub>opt</sub>&emsp;`` } ``  
  
&emsp;&emsp;<a name="NamespaceBody"></a>*NamespaceBody* **:**  
&emsp;&emsp;&emsp;<a name="NamespaceBody-ihomezph"></a>*[NamespacePropertyList](#NamespacePropertyList)*&emsp;`` , ``<sub>opt</sub>  
&emsp;&emsp;&emsp;<a name="NamespaceBody-srhr2gdj"></a>*[NamespacePropertyList](#NamespacePropertyList)*&emsp;`` ; ``<sub>opt</sub>  
  
&emsp;&emsp;<a name="NamespacePropertyList"></a>*NamespacePropertyList* **:**  
&emsp;&emsp;&emsp;<a name="NamespacePropertyList-feggpj5t"></a>*[NamespaceProperty](#NamespaceProperty)*  
&emsp;&emsp;&emsp;<a name="NamespacePropertyList-8g_wmadx"></a>*[NamespacePropertyList](#NamespacePropertyList)*&emsp;`` , ``&emsp;*[NamespaceProperty](#NamespaceProperty)*  
&emsp;&emsp;&emsp;<a name="NamespacePropertyList-isnpt3gn"></a>*[NamespacePropertyList](#NamespacePropertyList)*&emsp;`` ; ``&emsp;*[NamespaceProperty](#NamespaceProperty)*  
  
&emsp;&emsp;<a name="NamespaceProperty"></a>*NamespaceProperty* **:**  
&emsp;&emsp;&emsp;<a name="NamespaceProperty-vbdf9viv"></a>*[DecoratorList](#DecoratorList)*<sub>opt</sub>&emsp;`` op ``&emsp;*[Identifier](#Identifier)*&emsp;`` ( ``&emsp;*[ModelPropertyList](#ModelPropertyList)*<sub>opt</sub>&emsp;`` ) ``&emsp;`` : ``&emsp;*[Expression](#Expression)*  
  
&emsp;&emsp;<a name="Expression"></a>*Expression* **:**  
&emsp;&emsp;&emsp;<a name="Expression-otzlm2nv"></a>*[UnionExpressionOrHigher](#UnionExpressionOrHigher)*  
  
&emsp;&emsp;<a name="UnionExpressionOrHigher"></a>*UnionExpressionOrHigher* **:**  
&emsp;&emsp;&emsp;<a name="UnionExpressionOrHigher-l4bpz882"></a>*[IntersectionExpressionOrHigher](#IntersectionExpressionOrHigher)*  
&emsp;&emsp;&emsp;<a name="UnionExpressionOrHigher-kskkvztg"></a>*[UnionExpressionOrHigher](#UnionExpressionOrHigher)*&emsp;`` | ``&emsp;*[IntersectionExpressionOrHigher](#IntersectionExpressionOrHigher)*  
  
&emsp;&emsp;<a name="IntersectionExpressionOrHigher"></a>*IntersectionExpressionOrHigher* **:**  
&emsp;&emsp;&emsp;<a name="IntersectionExpressionOrHigher-fxst_igc"></a>*[ArrayExpressionOrHigher](#ArrayExpressionOrHigher)*  
&emsp;&emsp;&emsp;<a name="IntersectionExpressionOrHigher-g-cvp20d"></a>*[IntersectionExpressionOrHigher](#IntersectionExpressionOrHigher)*&emsp;`` & ``&emsp;*[ArrayExpressionOrHigher](#ArrayExpressionOrHigher)*  
  
&emsp;&emsp;<a name="ArrayExpressionOrHigher"></a>*ArrayExpressionOrHigher* **:**  
&emsp;&emsp;&emsp;<a name="ArrayExpressionOrHigher-jvcvemtw"></a>*[PrimaryExpression](#PrimaryExpression)*  
&emsp;&emsp;&emsp;<a name="ArrayExpressionOrHigher-8k-eixnj"></a>*[ArrayExpressionOrHigher](#ArrayExpressionOrHigher)*&emsp;`` [ ``&emsp;`` ] ``  
  
&emsp;&emsp;<a name="PrimaryExpression"></a>*PrimaryExpression* **:**  
&emsp;&emsp;&emsp;<a name="PrimaryExpression-kul-a19e"></a>*[Literal](#Literal)*  
&emsp;&emsp;&emsp;<a name="PrimaryExpression-mpejatd_"></a>*[ReferenceExpression](#ReferenceExpression)*  
&emsp;&emsp;&emsp;<a name="PrimaryExpression-k5j7cutc"></a>*[ParenthesizedExpression](#ParenthesizedExpression)*  
&emsp;&emsp;&emsp;<a name="PrimaryExpression-d007fnkw"></a>*[ModelExpression](#ModelExpression)*  
&emsp;&emsp;&emsp;<a name="PrimaryExpression-rmcinm4a"></a>*[TupleExpression](#TupleExpression)*  
  
&emsp;&emsp;<a name="Literal"></a>*Literal* **:**  
&emsp;&emsp;&emsp;<a name="Literal-xhtltz00"></a>*[StringLiteral](#StringLiteral)*  
&emsp;&emsp;&emsp;<a name="Literal-nqjh_sxl"></a>*[BooleanLiteral](#BooleanLiteral)*  
&emsp;&emsp;&emsp;<a name="Literal-pui0b1rt"></a>*[NumericLiteral](#NumericLiteral)*  
  
&emsp;&emsp;<a name="ReferenceExpression"></a>*ReferenceExpression* **:**  
&emsp;&emsp;&emsp;<a name="ReferenceExpression-mzr2yu9j"></a>*[IdentifierOrMemberExpression](#IdentifierOrMemberExpression)*&emsp;*[TemplateArguments](#TemplateArguments)*<sub>opt</sub>  
  
&emsp;&emsp;<a name="IdentifierOrMemberExpression"></a>*IdentifierOrMemberExpression* **:**  
&emsp;&emsp;&emsp;<a name="IdentifierOrMemberExpression-bras6mo_"></a>*[Identifier](#Identifier)*  
&emsp;&emsp;&emsp;<a name="IdentifierOrMemberExpression-fagplbkz"></a>*[IdentifierOrMemberExpression](#IdentifierOrMemberExpression)*&emsp;`` . ``&emsp;*[Identifier](#Identifier)*  
  
&emsp;&emsp;<a name="TemplateArguments"></a>*TemplateArguments* **:**  
&emsp;&emsp;&emsp;<a name="TemplateArguments-erulm7dq"></a>`` < ``&emsp;*[ExpressionList](#ExpressionList)*&emsp;`` > ``  
  
&emsp;&emsp;<a name="ParenthesizedExpression"></a>*ParenthesizedExpression* **:**  
&emsp;&emsp;&emsp;<a name="ParenthesizedExpression-s6bvnd5v"></a>`` ( ``&emsp;*[Expression](#Expression)*&emsp;`` ) ``  
  
&emsp;&emsp;<a name="ModelExpression"></a>*ModelExpression* **:**  
&emsp;&emsp;&emsp;<a name="ModelExpression-p9stvizw"></a>`` { ``&emsp;*[ModelBody](#ModelBody)*<sub>opt</sub>&emsp;`` } ``  
  
&emsp;&emsp;<a name="TupleExpression"></a>*TupleExpression* **:**  
&emsp;&emsp;&emsp;<a name="TupleExpression-mct6eje8"></a>`` [ ``&emsp;*[ExpressionList](#ExpressionList)*&emsp;`` ] ``  
  
&emsp;&emsp;<a name="ExpressionList"></a>*ExpressionList* **:**  
&emsp;&emsp;&emsp;<a name="ExpressionList-l7avubnp"></a>*[Expression](#Expression)*  
&emsp;&emsp;&emsp;<a name="ExpressionList-8cbmyyhk"></a>*[ExpressionList](#ExpressionList)*&emsp;`` , ``&emsp;*[Expression](#Expression)*  
  
&emsp;&emsp;<a name="DecoratorList"></a>*DecoratorList* **:**  
&emsp;&emsp;&emsp;<a name="DecoratorList-a6fvhq_2"></a>*[DecoratorList](#DecoratorList)*<sub>opt</sub>&emsp;*[Decorator](#Decorator)*  
  
&emsp;&emsp;<a name="Decorator"></a>*Decorator* **:**  
&emsp;&emsp;&emsp;<a name="Decorator-p1dbtqtg"></a>`` @ ``&emsp;*[IdentifierOrMemberExpression](#IdentifierOrMemberExpression)*&emsp;*[DecoratorArguments](#DecoratorArguments)*<sub>opt</sub>  
  
&emsp;&emsp;<a name="DecoratorArguments"></a>*DecoratorArguments* **:**  
&emsp;&emsp;&emsp;<a name="DecoratorArguments-kul-a19e"></a>*[Literal](#Literal)*  
&emsp;&emsp;&emsp;<a name="DecoratorArguments-gq6jlu5e"></a>`` ( ``&emsp;*[ExpressionList](#ExpressionList)*<sub>opt</sub>&emsp;`` ) ``  
  
