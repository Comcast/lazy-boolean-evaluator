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
	TrueA,
	AAND,
	FalseA,
	AOR,
	AXOR,
	ANOT,
	ANAND,
	ANOR
} from "../../domain/constants";
import { AsyncBooleanEvaluator } from "./asyncBooleanEvaluator";
import { AsyncBooleanPhrase } from "../../models/models";

describe("AsyncBooleanEvaluator", () => {
	let evaluator: AsyncBooleanEvaluator;

	beforeEach(() => {
		evaluator = new AsyncBooleanEvaluator();
	});

	it("should reject invalid phrases", async () => {
		const phrase: AsyncBooleanPhrase = [TrueA, AAND, FalseA, TrueA];

		try {
			await evaluator.evaluate(phrase);
			fail();
		} catch (err) {
			expect(true).toBeTrue();
		}
	});

	it("should negate with flag", async () => {
		const cases = [
			{
				phrase: [ANOT, FalseA],
				expected: true
			},
			{
				phrase: [ANOT, TrueA],
				expected: false
			},
			{
				phrase: [TrueA, AAND, [ANOT, FalseA]],
				expected: true
			},
			{
				phrase: [[ANOT, TrueA], AOR, [ANOT, FalseA]],
				expected: true
			},
			{
				phrase: [[ANOT, FalseA], AAND, [ANOT, [ANOT, TrueA]]],
				expected: true
			}
		];

		await runTests(cases);
	});

	it("should evaluate phrases with two conditions", async () => {
		const cases = [
			{
				phrase: [TrueA, AAND, TrueA],
				expected: true
			},
			{
				phrase: [TrueA, AOR, TrueA],
				expected: true
			},
			{
				phrase: [TrueA, AAND, FalseA],
				expected: false
			},
			{
				phrase: [TrueA, AOR, FalseA],
				expected: true
			},
			{
				phrase: [FalseA, AAND, FalseA],
				expected: false
			},
			{
				phrase: [FalseA, AOR, FalseA],
				expected: false
			},
			{
				phrase: [FalseA, AXOR, FalseA],
				expected: false
			},
			{
				phrase: [TrueA, AXOR, TrueA],
				expected: false
			},
			{
				phrase: [TrueA, AXOR, FalseA],
				expected: true
			},
			{
				phrase: [FalseA, AXOR, TrueA],
				expected: true
			},
			{
				phrase: [FalseA, ANAND, TrueA],
				expected: true
			},
			{
				phrase: [FalseA, ANAND, FalseA],
				expected: true
			},
			{
				phrase: [TrueA, ANAND, TrueA],
				expected: false
			},
			{
				phrase: [TrueA, ANAND, FalseA],
				expected: true
			},
			{
				phrase: [FalseA, ANOR, FalseA],
				expected: true
			},
			{
				phrase: [FalseA, ANOR, TrueA],
				expected: false
			},
			{
				phrase: [TrueA, ANOR, TrueA],
				expected: false
			},
			{
				phrase: [TrueA, ANOR, FalseA],
				expected: false
			}
		];

		await runTests(cases);
	});

	it("should evaluate phrases with > 2 conditions", async () => {
		const cases = [
			{
				phrase: [TrueA, AAND, TrueA, AAND, TrueA],
				expected: true
			},
			{
				phrase: [TrueA, AOR, TrueA, AOR, FalseA],
				expected: true
			},
			{
				phrase: [TrueA, AOR, FalseA, AOR, TrueA],
				expected: true
			},
			{
				phrase: [TrueA, AAND, FalseA, AOR, TrueA],
				expected: true
			},
			{
				phrase: [FalseA, AAND, TrueA, AOR, FalseA],
				expected: false
			},
			{
				phrase: [TrueA, AOR, FalseA, AAND, TrueA],
				expected: true
			},
			{
				phrase: [FalseA, AOR, TrueA, AAND, FalseA],
				expected: false
			},
			{
				phrase: [FalseA, AXOR, TrueA, AOR, TrueA],
				expected: true
			},
			{
				phrase: [FalseA, AXOR, FalseA, AOR, TrueA],
				expected: true
			},
			{
				phrase: [FalseA, AXOR, FalseA, AXOR, TrueA],
				expected: true
			},
			{
				phrase: [FalseA, ANAND, FalseA, AAND, TrueA],
				expected: true
			},
			{
				phrase: [FalseA, ANOR, FalseA, AAND, TrueA],
				expected: true
			}
		];

		await runTests(cases);
	});

	it("should evaluate phrases with many conditions", async () => {
		const cases = [
			{
				phrase: [
					TrueA,
					AOR,
					FalseA,
					AOR,
					TrueA,
					AAND,
					FalseA,
					AOR,
					FalseA,
					AOR,
					TrueA,
					AOR,
					FalseA
				],
				expected: true
			},
			{
				phrase: [
					TrueA,
					AAND,
					TrueA,
					AAND,
					TrueA,
					AAND,
					TrueA,
					AAND,
					TrueA,
					AAND,
					FalseA,
					AOR,
					FalseA,
					AOR,
					TrueA,
					AAND,
					TrueA,
					AAND,
					FalseA
				],
				expected: false
			},
			{
				phrase: [
					[FalseA, AOR, TrueA],
					AAND,
					[[TrueA, AOR, TrueA], AAND, [[FalseA, AAND, TrueA], AOR, TrueA]]
				],
				expected: true
			},
			{
				phrase: [
					[FalseA, AXOR, FalseA],
					AAND,
					[[TrueA, AOR, TrueA], AAND, [[FalseA, AAND, TrueA], AOR, TrueA]]
				],
				expected: false
			}
		];

		await runTests(cases);
	});

	it("should short circuit", async () => {
		const ABT = (
			index: number,
			bool: boolean,
			shouldBeHit: boolean
		): (() => Promise<boolean>) => {
			return () => {
				if (!shouldBeHit) {
					fail(
						`Short circuit failure: ${index}:${bool} should not have been hit!`
					);
				}
				return Promise.resolve(bool);
			};
		};

		const cases = [
			{
				phrase: [ABT(0, false, true), AAND, ABT(2, true, false)],
				expected: false
			},
			{
				phrase: [ABT(0, false, true), AOR, ABT(2, true, true)],
				expected: true
			},
			{
				phrase: [
					ABT(0, false, true),
					AOR,
					ABT(2, false, true),
					AOR,
					ABT(4, true, true),
					AOR,
					ABT(6, false, false)
				],
				expected: true
			}
		];

		await runTests(cases);
	});

	async function runTests(cases) {
		for (let i = 0; i < cases.length; i++) {
			const tc = cases[i];
			try {
				const result = await evaluator.evaluate(tc.phrase);
				if (result !== tc.expected) {
					console.error(tc.phrase, {
						expected: tc.expected,
						result
					});
				}
				expect(result).toBe(tc.expected);
			} catch (err) {
				console.error(tc.phrase, err);
				throw err;
			}
		}
	}
});
