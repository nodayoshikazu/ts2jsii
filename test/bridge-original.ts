import {
    ExampleClass as ExampleClassOrigin,
    globalExample as globalExampleOrigin
} from "./original";
export class Globals {
    globalExample() {
	return globalExampleOrigin();
    }
}
export class StringOrNumber {
    /**
     * @internal
     */
    public _value: any;
    private constructor(value: string | number) {
	this._value = value;
    }
    static fromStr(value: string): StringOrNumber {
	return new StringOrNumber(value);
    }
    static fromNum(value: number): StringOrNumber {
	return new StringOrNumber(value);
    }
}
export class ExampleClass {
    _boxed: ExampleClassOrigin;
    constructor(name: string, age: number) {
	this._boxed = new ExampleClassOrigin(name, age);
    }
    /**
     * Greets output message to console.log
     */
    greet(param: StringOrNumber) {
	this._boxed.greet(param._value);
    }
}
