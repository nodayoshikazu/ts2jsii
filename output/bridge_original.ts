import {
    ExampleClass as ExampleClassOrigin,
    globalExample as globalExampleOrigin,
    globalError as globalErrorOrigin,
    globalLogging as globalLoggingOrigin
} from "./original";

export class Globals {
    globalExample() {
	return globalExampleOrigin();
    }

    globalError(message: string, d: Date) {
	return globalErrorOrigin(message, d);
    }

    globalLogging(messages: string[], d: Date) {
	return globalLoggingOrigin(messages, d);
    }

}
export classs StringOrNumberOrStringArrayOrNumberArray {
    public _value: any;
    private constructor(value: string | number | string[] | number[]) {
         this._value = value;
    }
    static fromStr(value: string): StringOrNumberOrStringArrayOrNumberArray {
         return new StringOrNumberOrStringArrayOrNumberArray(value);
    }
    static fromNum(value: number): StringOrNumberOrStringArrayOrNumberArray {
         return new StringOrNumberOrStringArrayOrNumberArray(value);
    }
    static fromStrArray(value: string[]): StringOrNumberOrStringArrayOrNumberArray {
         return new StringOrNumberOrStringArrayOrNumberArray(value);
    }
    static fromNumArray(value: number[]): StringOrNumberOrStringArrayOrNumberArray {
         return new StringOrNumberOrStringArrayOrNumberArray(value);
    }
}

export class ExampleClass {
    _boxed: ExampleClassOrigin;
    constructor(name: string, age: number, date: address: string[], lnum: number[]) {
	_boxed = new ExampleClassOrigin(name, age, date, address, lnum);
    }
    constructor(name: string) {
	_boxed = new ExampleClassOrigin(name);
    }
    getName(param: string | number | string[] | number[]) {
	this._boxed.getName(param._value);
    }
    greet(param: string | number | string[] | number[]) {
	this._boxed.greet(param._value);
    }
    showErrr(param: string | number | string[] | number[]) {
	this._boxed.showErrr(param._value);
    }

}
