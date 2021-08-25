/**
 * Type definitions
 */
export type AsyncBooleanF = () => Promise<boolean>;
export type AsyncBooleanAnd = "&";
export type AsyncBooleanOr = "|";
export type AsyncBooleanXor = "XOR";
export type AsyncBooleanXnand = "!&";
export type AsyncBooleanXnor = "!|";
export type AsyncBooleanComparison =
	| AsyncBooleanAnd
	| AsyncBooleanOr
	| AsyncBooleanXor
	| AsyncBooleanXnand
	| AsyncBooleanXnor;
export type AsyncBooleanNegation = "!";

export type AsyncBooleanWord =
	| [AsyncBooleanNegation, AsyncBooleanF]
	| [AsyncBooleanF]
	| AsyncBooleanF;
//type AsyncBooleanPhrase = [ AsyncBooleanWord, AsyncBooleanComparison, AsyncBooleanWord ] | [ AsyncBooleanWord, AsyncBooleanComparison, AsyncBooleanPhrase ];
export type AsyncBooleanPhrase =
	| AsyncBooleanWord
	| AsyncBooleanComparison
	| Array<AsyncBooleanWord | AsyncBooleanComparison | AsyncBooleanPhrase>;
export type AsyncBooleanStatement = AsyncBooleanWord | AsyncBooleanPhrase;
