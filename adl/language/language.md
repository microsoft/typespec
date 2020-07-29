# Draft ADL Language Grammar

# Comments

# Structure

### Grammar Legend
- '?' is optional 
- '+?' represents zero or more 
- '+' represents one or more
- '[' ... ']' represents a range of characters
- YAML Array '-' is a choice of one of the elements.

``` yaml

InputElement: 
  - ImportStatement+?
  - Declaration+?

ImportKeyword: 'import'
AsKeyword: 'as'
AliasKeyword: 'alias'
AnnotationKeyword: 'annotation' 
ConstraintKeyword: 'constraint' 
ServiceKeyword: 'service' 
PartialKeyword: 'partial' 
InterfaceKeyword: 'interface'
ModelKeyword: 'model'
EnumKeyword: 'enum'
ConstructorKeyword: 'constructor'

ImportStatement:
  - ImportKeyword Identifier Semicolon
  - ImportKeyword Identifier AsKeyword OpenBrace CloseBrace
  - ImportKeyword Identifier AsKeyword OpenBrace NamedImports CloseBrace

NamedImports: 
  - Identifier
  - Identifier Comma NamedImports+

ScopedIdentifier:
  - Identifier
  - Identifier Colon Identifier

Identifier:
  - IdentifierName but not ReservedWord

IdentifierName: IdentifierStart IdentifierContinue+?

IdentifierStart: [A-Za-z]

IdentifierContinue: [A-Za-z0-9]

Declaration: 
  - TypeDeclaration
  - AnnotationDeclaration
  - ConstraintDeclaration
  - ServiceDeclaration
  - InterfaceDeclaration
  - ResponseDeclaration
  - ResponseGroupDeclaration

TypeDeclaration: 
  - AliasDeclaration
  - ModelDeclaration
  - EnumDeclaration

AliasDeclaration: 
  - AliasKeyword Identifier Colon TypeExpression Semicolon
  - AliasKeyword Identifier OpenAngle TemplateDeclaration CloseAngle Colon TypeExpression Semicolon

AnnotationDeclaration: 
  - Annotation+? AnnotationKeyword Identifier OpenParen Parameters CloseParen OpenBrace LanguageAgnosticScript CloseBrace
  - Annotation+? AnnotationKeyword Identifier OpenParen Parameters CloseParen Semicolon

Parameters: 
  - Identifier Colon TypeExpression
  - Identifier Colon TypeExpression Comma Parameters+ 

ConstraintDeclaration: 
  - Annotation+? ConstraintKeyword Identifier OpenParen Parameters CloseParen OpenBrace LanguageAgnosticAssertionsScript CloseBrace
  - Annotation+? ConstraintKeyword Identifier OpenParen Parameters CloseParen Semicolon

ServiceDeclaration: 
  - Annotation+? PartialKeyword? ServiceKeyword Identifier OpenBrace ServiceDefinition CloseBrace
  - Annotation+? PartialKeyword? ServiceKeyword Identifier Semicolon

ServiceDefinition: # order not important
  - Constructor?
  - InterfaceDeclaration+?

Constructor: 
  - ConstructorKeyword OpenParen Parameters CloseParen Semicolon
  - ConstructorKeyword OpenParen Parameters CloseParen OpenBrace LanguageAgnosticScript CloseBrace

InterfaceDeclaration:
  - Annotation+? PartialKeyword? InterfaceKeyword Identifier OpenBrace InterfaceDefinition CloseBrace
  - Annotation+? PartialKeyword? InterfaceKeyword Identifier Semicolon

InterfaceDefinition: 
  - MethodDeclaration+?

MethodDeclaration: 
  - Annotation+? Identifier OpenParen Parameters CloseParen MethodResponse

MethodResponse:   # still in discussion
  - Type 
  - InlineResponse

InlineResponse: tba # still in discussion  
ResponseDeclaration: tba # still in discussion
ResponseGroupDeclaration: tba # still in discussion

ModelDeclaration: 
  - Annotation+? PartialKeyword? ModelKeyword Identifier TemplateDeclaration? AllOf? Semicolon
  - Annotation+? PartialKeyword? ModelKeyword Identifier TemplateDeclaration? AllOf? OpenBrace PropertyDefinition+? CloseBrace;

TemplateDeclaration: OpenAngle Identifier AdditionalTemplateDeclarations? CloseAngle
AdditionalTemplateDeclarations: Comma Identifier AdditionalTemplateDeclarations+?

AllOf: Colon AllOfValues
AllOfValues:
  - ScopedIdentifier TemplateArguments?
  - ScopedIdentifier TemplateArguments? Comma AllOfValues+

PropertyDefinition:  Annotation+? Identifier Colon TypeExpression Semicolon

EnumDeclaration: Annotation+? PartialKeyword? EnumKeyword Identifier AllOf? OpenBrace EnumDefinition CloseBrace;
EnumDefinition: Annotation+? Identifier Colon Value Semicolon
  
TypeExpression: Annotation+? Type

Type: 
  - PrimitiveType    # Built-in Primitive Types
  - LiteralType      # Literal Value Types
  - ScopedIdentifier TemplateArguments? # Enums, Models
  - UnionType        # string|int|boolean etc

TemplateArguments: OpenAngle Identifier AdditionalTemplateArguments? CloseAngle
AdditionalTemplateArguments: Comma Identifier AdditionalTemplateArguments+?

LiteralType: Value

UnionType: 
  - TypeExpression
  - TypeExpression Pipe UnionType?

Annotation: OpenBracket AnnotationStatement CloseBracket

AnnotationStatement: 
  - Identifier 
  - Identifier OpenParen CloseParen
  - Identifier OpenParen AnnotationArguments CloseParen

Pipe: '|'
OpenAngle: '<'
CloseAngle: '>'
OpenParen: '('
CloseParen: ')'
OpenBrace: '{'
CloseBrace: '}'
Colon: ':'
Comma: ','
Semicolon: ';'
OpenBracket: '['
CloseBracket: ']'
Dot: '.'

AnnotationArguments: 
  - Value                     
  - Value Comma AnnotationArguments+

Value: 
  - NumericLiteral 
  - StringLiteral
  - BooleanLiteral

NumericLiteral:
  - DecimalDigits
  - DecimalDigits Dot DecimalDigits
  - DecimalDigits Dot DecimalDigits Exponent
  - Dot DecimalDigits
  - Dot DecimalDigits Exponent
  - DecimalDigits Exponent
  - HexLiteral
  - BinaryLiteral

DecimalDigits: 0-9 DecimalDigits+?

Exponent: ExponentIndicator Sign DecimalDigits

ExponentIndicator: 
  - 'e'
  - 'E'

Sign: 
  - '+'
  - '-' 

HexLiteral: HexPrefix HexDigits
HexPrefix: 
  - '0x'
  - '0X' 

HexDigits: [0-9a-fA-F] HexDigits+

BinaryLiteral: BinaryPrefix BinaryDigits
BinaryPrefix: 
  - '0b' 
  - '0B'

BinaryDigits: [0-1] BinaryDigits+

BooleanLiteral:
  - 'true'
  - 'false'

StringLiteral:
  - '"' DoubleStringCharacters+? '"'
  - '\'' SingleStringCharacters+? '\''
  - '`' BacktickStringCharacters+? '`'

DoubleStringCharacters: DoubleStringCharacter DoubleStringCharacters+?

DoubleStringCharacter:
  - SourceCharacter but not one of '"' or  '\'
  - '\' EscapeSequence

SingleStringCharacters: SingleStringCharacter SingleStringCharacters+?

SingleStringCharacter:
  - SourceCharacter but not one of ''' or  '\'
  - '\' EscapeSequence

BacktickStringCharacters: BacktickStringCharacter BacktickStringCharacters+?

BacktickStringCharacter:
  - SourceCharacter but not one of '\'' or  '\'
  - '\' EscapeSequence

EscapeSequence:
  - EscapeCharacter
  - SourceCharacter but not one of EscapeCharacter

EscapeCharacter: 
  - '"'
  - "'"

WhiteSpace: 
  - ' '
  - '\t'
  - '\r'
  -  '\n' 

ReservedWord:
  - ServiceKeyword        # container for interfaces
  - ConstructorKeyword    # used to declare required values for initializing a 'client' in a service
  - InterfaceKeyword
  - PartialKeyword
  - ModelKeyword
  - EnumKeyword
  - AliasKeyword
  - ImportKeyword
  - AsKeyword

  - AnnontationKeyword
  - ConstraintKeyword
  - BooleanLiteral

  - PrimitiveType

  - 'response' 
  - 'responses'
  - 'return'
  - 'throw' 
  
PrimitiveType: # types
  - 'int8'
  - 'int16'
  - 'int32' 
  - 'int64'
  - 'float16'
  - 'float32'
  - 'float64'
  - 'duration'
  - 'time'
  - 'datetime'
  - 'string'
  - 'boolean'
 
LanguageAgnosticScript: Undefined # Not in V1
LanguageAgnosticAssertionsScript:  Undefined # Not in V1

```