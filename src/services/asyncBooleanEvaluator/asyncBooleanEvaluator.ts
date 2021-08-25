/**
* Copyright 2021 Comcast Cable Communications Management, LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
* SPDX-License-Identifier: Apache-2.0
*/

import {
	AsyncBooleanPhrase,
	AsyncBooleanStatement,
	AsyncBooleanComparison,
	AsyncBooleanWord,
	AsyncBooleanF,
	AsyncBooleanXor
} from "../../models/models";
import { AAND, AOR, AXOR, ANOT, ANAND, ANOR } from "../../domain/constants";
import { IAsyncBooleanEvaluator } from "../../models/asyncBooleanEvaluator";

/**
 * Evaluator: evaluates a phrase recursively and applies short circuiting
 */
export class AsyncBooleanEvaluator implements IAsyncBooleanEvaluator {
	evaluate(phrase: AsyncBooleanPhrase): Promise<boolean> {
		return this.evaluatePhrase(phrase);
	}

	/**
	 * Recursively evaluate a phrase
	 * @param phrase
	 * @param wordNum
	 */
	private async evaluatePhrase(
		phrase: AsyncBooleanPhrase,
		wordNum = []
	): Promise<boolean> {
		if (
			!phrase ||
			(Array.isArray(phrase) && phrase.length % 2 === 0 && phrase[0] !== ANOT)
		) {
			throw new Error(`Invalid phrase! ${wordNum.toString()}`);
		}

		let pending: AsyncBooleanPhrase = this.groupPhrase(phrase);
		if (!Array.isArray(pending) && typeof pending === "function") {
			return pending();
		}

		//order must be preserved
		pending = this.preProcessPhrase(phrase);

		wordNum.push(0);
		while (pending.length > 1) {
			let currentWp = pending[0] as AsyncBooleanStatement;
			currentWp = this.preProcessPhrase(currentWp);

			const operator: AsyncBooleanComparison = pending[1] as AsyncBooleanComparison;
			const currentBool = await this.evaluateSingle(currentWp, wordNum);

			switch (operator) {
				case AAND:
					if (!currentBool) {
						return false;
					}
					break;
				case AOR:
					if (currentBool) {
						return true;
					}
					break;
			}

			//@ts-ignore
			pending.splice(0, 2);
			wordNum[wordNum.length - 1]++;
		}

		let lastWord = pending[0];
		lastWord = this.preProcessPhrase(lastWord);

		const result = await this.evaluateSingle(
			lastWord as AsyncBooleanStatement,
			wordNum
		);
		wordNum.splice(wordNum.length - 1, 1);
		return result;
	}

	/**
	 * Group into form which will execute with the same behavior as normal boolean operations
	 * @param phrase
	 */
	private groupPhrase(phrase: AsyncBooleanPhrase): AsyncBooleanPhrase {
		if (!Array.isArray(phrase) || phrase.length < 4) {
			return phrase;
		}

		let newPhrase: AsyncBooleanPhrase = [...phrase] as AsyncBooleanPhrase;
		for (let i = 1; i < newPhrase.length; i += 2) {
			const left = newPhrase[i - 1];
			const operator = newPhrase[i];
			const right = newPhrase[i + 1];

			if (operator === AAND) {
				let replacement = [left, operator, right] as AsyncBooleanPhrase;
				const spliced = (newPhrase as Array<any>).splice(i - 1, 3, replacement);
				i -= 2;
			}
		}

		return newPhrase;
	}

	/**
	 * Before evaluating some phrase, ensure we make rewrites as needed
	 * @param phrase
	 */
	private preProcessPhrase(phrase: AsyncBooleanPhrase): AsyncBooleanPhrase {
		phrase = this.rewriteXor(phrase);
		phrase = this.rewriteNand(phrase);
		phrase = this.rewriteNor(phrase);
		phrase = this.rewriteNot(phrase);
		return phrase;
	}

	/**
	 * Find all instances of Xor and convert to statements with AND and OR
	 * @param phrase
	 */
	private rewriteXor(phrase: AsyncBooleanPhrase): AsyncBooleanPhrase {
		if (!Array.isArray(phrase)) {
			return phrase;
		}

		const phraseArray = Array.from(phrase as any);
		let xorIndex = phraseArray.indexOf(AXOR);
		while (xorIndex > -1) {
			//memoize functions to the left and right
			const leftPhraseIndex = xorIndex - 1;
			const rightPhraseIndex = xorIndex + 1;

			const leftPhrase = phraseArray[leftPhraseIndex];
			const rightPhrase = phraseArray[rightPhraseIndex];

			const leftMemoized = this.memoizeEvaluation(
				leftPhrase as AsyncBooleanPhrase
			);
			const rightMemoized = this.memoizeEvaluation(
				rightPhrase as AsyncBooleanPhrase
			);

			const replacementPhrase: AsyncBooleanPhrase = [
				[leftMemoized, AAND, [ANOT, rightMemoized]],
				AOR,
				[rightMemoized, AAND, [ANOT, leftMemoized]]
			];

			phraseArray.splice(leftPhraseIndex, 3, replacementPhrase);

			xorIndex = phraseArray.indexOf(AXOR);
		}

		return phraseArray as AsyncBooleanPhrase;
	}

	/**
	 * Find all instances of Nand and convert to statements with AND and OR
	 * @param phrase
	 */
	private rewriteNand(phrase: AsyncBooleanPhrase): AsyncBooleanPhrase {
		if (!Array.isArray(phrase)) {
			return phrase;
		}

		const phraseArray = Array.from(phrase as any);
		let nandIndex = phraseArray.indexOf(ANAND);
		while (nandIndex > -1) {
			//memoize functions to the left and right
			const leftPhraseIndex = nandIndex - 1;
			const rightPhraseIndex = nandIndex + 1;

			const leftPhrase = phraseArray[leftPhraseIndex];
			const rightPhrase = phraseArray[rightPhraseIndex];

			const replacementPhrase: AsyncBooleanPhrase = [
				[ANOT, [leftPhrase, AAND, rightPhrase]]
			] as AsyncBooleanPhrase;

			phraseArray.splice(leftPhraseIndex, 3, ...replacementPhrase);

			nandIndex = phraseArray.indexOf(ANAND);
		}

		return phraseArray as AsyncBooleanPhrase;
	}

	/**
	 * Find all instances of Nor and convert to statements with AND and OR
	 * @param phrase
	 */
	private rewriteNor(phrase: AsyncBooleanPhrase): AsyncBooleanPhrase {
		if (!Array.isArray(phrase)) {
			return phrase;
		}

		const phraseArray = Array.from(phrase as any);
		let norIndex = phraseArray.indexOf(ANOR);
		while (norIndex > -1) {
			//memoize functions to the left and right
			const leftPhraseIndex = norIndex - 1;
			const rightPhraseIndex = norIndex + 1;

			const leftPhrase = phraseArray[leftPhraseIndex];
			const rightPhrase = phraseArray[rightPhraseIndex];

			const replacementPhrase: AsyncBooleanPhrase = [
				[ANOT, [leftPhrase, AOR, rightPhrase]]
			] as AsyncBooleanPhrase;

			phraseArray.splice(leftPhraseIndex, 3, ...replacementPhrase);

			norIndex = phraseArray.indexOf(ANOR);
		}

		return phraseArray as AsyncBooleanPhrase;
	}

	/**
	 * Change instances of [ANOT, func] to [func.then(bool => !bool)];
	 * @param phrase
	 */
	private rewriteNot(phrase: AsyncBooleanPhrase): AsyncBooleanPhrase {
		if (!Array.isArray(phrase)) {
			return phrase;
		}

		const phraseArray = Array.from(phrase as any);
		let notIndex = phraseArray.indexOf(ANOT);
		while (notIndex > -1) {
			//memoize functions to the left and right
			const rightPhraseIndex = notIndex + 1;
			const rightPhrase = phraseArray[rightPhraseIndex];

			const replacementPhrase: AsyncBooleanPhrase = () =>
				this.evaluate(rightPhrase as AsyncBooleanPhrase).then(bool => !bool);

			phraseArray.splice(notIndex, 2, replacementPhrase);

			notIndex = phraseArray.indexOf(ANOT);
		}

		return phraseArray as AsyncBooleanPhrase;
	}

	/**
	 * Memoize the evaluation so input function executions are not repeated
	 * @param phrase
	 */
	private memoizeEvaluation(
		phrase: AsyncBooleanPhrase
	): () => Promise<boolean> {
		let result: boolean | null = null;
		return async () => {
			if (result === null) {
				result = await this.evaluate(phrase);
			}
			return result as boolean;
		};
	}

	/**
	 * Evaluate a single word / phrase
	 * If more than one phrase, recursively call evaluatePhrase
	 * @param word
	 * @param wordNum
	 */
	private evaluateSingle(
		word: AsyncBooleanWord | AsyncBooleanPhrase,
		wordNum
	): Promise<boolean> {
		if (!Array.isArray(word) && typeof word === "function") {
			return word();
		} else if (!word) {
			throw new Error(
				`Word is falsey! ${word} : ${typeof word} => ${wordNum.toString()}`
			);
		}

		let func: AsyncBooleanF = () => {
			throw new Error(`Not assigned! ${wordNum.toString()}`);
		};
		let isNegated = false;
		switch (word.length) {
			case 1:
				func = word[0] as AsyncBooleanF;
				break;
			case 2:
				isNegated = true;
				func = word[1] as AsyncBooleanF;
				break;
			default:
				func = () => this.evaluatePhrase(word, wordNum);
				break;
		}

		if (typeof func === "function") {
			return func().then(bool => !isNegated && bool);
		} else {
			return this.evaluate(func).then(bool => !isNegated && bool);
		}
	}
}
