# lazy-boolean-evaluator

This library allows for boolean operations over asynchronous functions which return a Promise<boolean>.  This uses short circuit evaluation.  Useful in situations where performing certain asynchronous actions is conditional on the results of previous asynchronus actions, and thus can be used to optimize by doing the least amount of work necessary.
  
## Background
Programming languages will evaluate boolean expressions to a single boolean: true && false == false. In the case of the R-Query tool, we needed to take this concept and apply it to async functions which return promises of booleans. This is how that tool is able to filter through input and files based on certain conditions. The below code snippet exemplifies the requirement.
```javascript
//Normal
const normalBool = true && false || false;
console.log(normalBool); // false

//Promise based (ugly and verbose as is here)
const promiseBool = (await Promise.resolve(true)) && (await Promise.resolve(false)) || (await Promise.resolve(false));
console.log(promiseBool); //false

//Function which returns promise based (even worse)
const funcPromiseBool = (await (() => Promise.resolve(true))()) && (await (() => Promise.resolve(false))()) || (await (() => Promise.resolve(false))());
console.log(funcPromiseBool); //false

/*
* When the number of boolean variables is dynamic, instead of static like above, the problem is worse.
*/
```

In order to be able to implement the R-Query tool without making the codebase immediately unmaintainable, this functionality was created in a separate, generic, and reusable library: lazy-boolean-evaluator.


## Using this Library
This library provides an interface which resembles normal boolean expressions.
The following are the basic tokens:
* **AAND**: token which indicates a boolean AND operation (AsyncAND)
* **AOR**: token which indicates a boolean OR operation (AsyncOR)
* **AXOR**: token which indicates a boolean XOR operation (AsyncXOR)
* **ANOT**: token which indicates the value immediately to the right should be negated (pair must exist in its own array)
* **ANAND**: token which indicates a boolean ANAND operation (AsyncNand)
* **ANOR**: token which indicates a boolean ANOR operation (AsyncNor)
* **TrueA**: function which resolves to true: ```() => Promise.resolve(true);```
* **FalseA**: function which resolves to false: ```() => Promise.resolve(false);```

Async boolean expressions can be created by combining these into an array;
```javascript
//asyncFunc = a function which returns a promise of a boolean (including TrueA and FalseA)
//asyncOperator = AAND or AOR
const phrase = [asyncFunc, ...[asyncOperator, asyncFunc]];

const examplePhrase = [FalseA, AOR, TrueA, AAND, TrueA];
```
Phrases can also be nested to any level:
```javascript
const phrase = [asyncFunc, AAND, [asyncFunc, AOR, asyncFunc], AOR, [asyncFunc, AAND, [asyncFunc, AOR, asyncFunc]]];
```

The async functions are lazily evaluated and short circuted:
```javascript
lazyExample = [asyncFuncThatReturnsTrue, AOR, asyncFuncThatReturnsFalse];
//asyncFuncThatReturnsFalse is never called : lazyExample = true

lazyExample = [asyncFuncThatReturnsTrue, AAND, asyncFuncThatReturnsFalse];
//asyncFuncThatReturnsFalse is called : lazyExample = false
```

The following is an example which shows a normal boolean phrase, then its async counterpart.
```javascript
//Normal
const nResult = true && false || true;

//Lazy
const phrase = [TrueA, AAND, FalseA, AOR, TrueA];
const lResult = await new AsyncBooleanEvaluator().evaluate(phrase);

//Practical example
const minorExpensiveTask = async () => { /* do some task */; return isSuccessful;};
const majorExpensiveTask = async () => { /* do some task */; return isSuccessful;};

const execution = [minorExpensiveTask, AOR, majorExpensiveTask];
//evaluate the execution phrase, only call majorExpensiveTask if the minorExpensiveTask failed
const isSuccessful = await new AsyncBooleanEvaluator().evaluate(execution);
//that will run through one or both, depending upon the output of the first, then return true if either were successful

```
