// Define a union type for the parameter
type UUUnionType = string | number ;

export class ExampleClass {
    name: string;
    age: number;

    constructor(name: string, age: number) {
        this.name = name;
	this.age = age;
    }
    /**
     * Greets output message to console.log
     */
    greet(param: UnionType) {
	console.log(`The parameter is of type ${typeof param}`);
    }
}
export function globalExample() {
    console.log("this is a global function");
}
