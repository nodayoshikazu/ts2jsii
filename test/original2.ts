// Define a union type for the parameter
type UUUnionType = string | number | boolean | any | Date ;

export class ExampleClass {
    name: string;
    age: number;
    date: Date;
    data: any;
    
    constructor(name: string, age: number, date: Date, data: any) {
        this.name = name;
	this.age = age;
	this.date = date;
	this.data = data;
    }
    /**
     * Greets output message to console.log
     */
    greet(param: UnionType) {
	console.log(`The parameter is of type ${typeof param}`);
    }
    showErrr(param: UnionType) {
	globalError(param);
    }
}
export function globalExample() {
    console.log("this is a global function");
}

export function globalError(message: string, d: Date) {
    console.error(message, d);
}
