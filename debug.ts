import { TrueA, AAND, FalseA, AOR } from "./src/domain/constants";
import { AsyncBooleanEvaluator } from "./src/services/asyncBooleanEvaluator";

Run();
async function Run() {
	//const phrase = [TrueA, AAND, TrueA, AAND, FalseA, AOR, FalseA, AOR, TrueA, AAND, TrueA, AAND, FalseA];
	const phrase = [
		TrueA,
		AAND,
		TrueA,
		AAND,
		FalseA,
		AOR,
		TrueA,
		AAND,
		TrueA,
		AAND,
		FalseA
	];
	const evaluator = new AsyncBooleanEvaluator();

	console.log("Phrase: ", phrase);
	const result = await evaluator.evaluate(phrase);
	console.log("Result:", result);
}
