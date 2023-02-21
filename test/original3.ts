// Define a union type for the parameter
type UUUnionType = string | number | string[] | number[] ;

export class ExampleClass {
    name: string;
    age: number;
    address: string[];
    luckynumbers: number[];
    
    constructor(name: string, age: number, date: address: string[], lnum: number[]) {
        this.name = name;
	this.age = age;
	this.address = address;
	this.luckynumbers = lnum;
    }
    constructor(name: string) {
        this.name = name;
    }
    getName(): string {
	return this.name;
    }
    /**
     * Greets output message to console.log
     */
    greet(param: UnionType): void {
	console.log(`The parameter is of type ${typeof param}`);
    }
    showErrr(param: UnionType): void {
	globalError(param);
    }
}
export function globalExample() {
    console.log("this is a global function");
}

export function globalError(message: string, d: Date) {
    console.error(message, d);
}

export function globalLogging(messages: string[], d: Date) {
    for (let msg of messages)
	console.log(`${msg} on ${d}`);
}
