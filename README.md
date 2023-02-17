# ts2jsii
Trial project: programmatically transform a typescript original.ts to bridge-original.ts

##### Prerequisite

$ npm install


##### Compile

$ tsc ts2jsii.ts --m commonjs


##### Running

$ node ts2jsii.js original.ts


##### Result as of Feb 17,2023

```
import {
    // foo as fooOrigin
    ExampleClass as ExampleClassOrigin,
    globalExample as globalExampleOrigin
} from "./upwork_original";

export class Globals {
    globalExample() {
	return globalExampleOrigin();
    }

}
export classs StringOrNumber {
    public _value: any;
    private constructor(value: string | number) {
         this._value = value;
    }
    static fromstring(value: string): StringOrNumber {
         return new StringOrNumber(value);
    }
    static fromnumber(value: number): StringOrNumber {
         return new StringOrNumber(value);
    }
}

export class ExampleClass {
    _boxed: ExampleClassOrigin;
    constructor(name: string, age: number) {
	_boxed = new ExampleClassOrigin(name, age);
    }
    greet(param: string | number) {
	this._boxed.greet(param._value);
    }

}
```
