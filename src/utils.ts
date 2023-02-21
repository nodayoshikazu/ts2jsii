import * as Handlebars from 'handlebars';

// uses handlebrs.js

const COPY_CLASS_TEMPLATE: string = 
`export class {{classname}} {
    _boxed: {{classname}}Origin;
`;

const COPY_CLASS_CTOR_TEMPLATE: string = 
`    constructor({{constructor_signature}}) {
	this._boxed = new {{classname}}Origin({{params}});
    }
`;

const COPY_CLASS_METHOD_TEMPLATE: string =
`    {{method_name}}(param: {{union_typename}}) {
	this._boxed.{{method_name}}(param._value);
    }
`;

const UNION_CLASS_TEMPLATE: string =
`export class {{classname}} {
    public _value: any;
    private constructor(value: {{typetext}}) {
         this._value = value;
    }
`;  // add methods and a closing brace at the end

const GLOBAL_TEMPLATE: string =
`export class Globals {
{{fns}}
}`;

const GLOBAL_FN_TEMPLATE: string = 
`    {{fnname}}({{params}}) {
	return {{fnname}}Origin({{pnames}});
    }
`;

const IMPORT_FN_TEMPLATE: string = `{{fnname}} as {{fnname}}Origin`;
const IMPORT_TEMPLATE: string =
`import {
    {{imports}}
} from "./original";\n\n`;


export class Ts2jsiiUtils {
    union_typename: string;
    union_typename_ored: string;
    
    capitalizeFirstLetter(str: string): string {
	return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
    }

    findClassNameFromDecl(decl: string): string {
	let m: any = decl.match(/class +([\S]+)/);
	if (!m) {
	    console.error(`Error: class name is not found in "${decl}"`);
	    return null;
	}
	return m[1];
    }

    // e.g.constructor(name: string, age: number) 
    findCtorSignatureFromDecl(fndecl: string): string {
	let m: any = fndecl.match(/constructor\(([^\)]+)\)/);
	if (!m) {
	    console.error(`Error: class constructor is not found in "${fndecl}"`);
	    return null;
	}
	return m[1];
    }

    buildCopyClassTemplate(class_decl: string): string {
	let classname: string = this.findClassNameFromDecl(class_decl);
	let data: Object = {classname: classname};
	let tmpl: any = Handlebars.compile(COPY_CLASS_TEMPLATE);
	// add ctor, method afer this
	return tmpl(data);
    }

    buildCopyClassCtor(decl: string): string {
	let classname: string = this.findClassNameFromDecl(decl);
	let ctors: string[] = decl.match(/constructor\([^\)]*\)/g);
	let numCtors: number = ctors.length;
	let results: string[] = [];
	
	for (let ctor of ctors) {
	    // Takes care of overloaded ctors if any
	    let sig: string = this.findCtorSignatureFromDecl(ctor);
	    let params: string = sig.match(/([\S]+)(?=:)/g).join(', ');
	    let data: Object = {constructor_signature: sig,
				classname: classname,
				params: params};

	    let tmpl: any = Handlebars.compile(COPY_CLASS_CTOR_TEMPLATE);
	    results.push(tmpl(data));
	}
	return results.join('');
    }

    buildCopyClassMethod(decl: string): string {
	let method_name: string = decl.match(/^([\S]+)(?=\()/)[1];
	debugger
	let tmpl: any = Handlebars.compile(COPY_CLASS_METHOD_TEMPLATE);
	let data: Object = {method_name: method_name, union_typename: this.union_typename};
	return tmpl(data);
    }

    buildUnionClassNameFromTypes(text: string): string {
	
	let types: string[] = text.split(/ *\| */);  // remove spaces around |
	const brac2str = t => this.capitalizeFirstLetter(t.replace('[]', 'Array'));
	types = types.map(brac2str);
	
	let classname: string = '';
	let tmpl: any = Handlebars.compile("{{classname}}Or{{typename}}");
    
	for (let t of types) {
	    let data: Object = {classname: classname, typename: t};
	    classname = tmpl(data);
	}
	// Remove the first OR
	classname = classname.replace(/^Or/, '');
	this.union_typename_ored = text;
	this.union_typename = classname;
	return classname;
    }

    buildClassTemplateForUnionType(classname: string): string {
	let tmpl: any = Handlebars.compile(UNION_CLASS_TEMPLATE);
	let data: Object = {classname: classname, typetext: this.union_typename_ored};
	let union_class_template2: string = tmpl(data);
	return union_class_template2;
    }

    buildMethodsFromTypes(text: string, classname: string): string {
	let types: string[] = text.split(/ *\| */);  // remove spaces around |
	const abbrevTypes: Object = {
	    'string': 'Str',
	    'number': 'Num',
	    'boolean': 'Bool',
	    'any': 'Any',
	    'Date': 'Date',
	    'Object': 'Obj'
	};
	const _tmpl: any =
`    static from{{typename}}(value: {{typename_orig}}): {{classname}} {
         return new {{classname}}(value);
    }`;
	let tmpl: any = Handlebars.compile(_tmpl);
	let methods: string[] = [];
	
	for (let t of types) {
	    let brackets: string = '';
	    let t_o: string = t;
	    if (t.endsWith('[]')) {
		t = t.replace('[]', '');
		brackets = 'Array';
	    }
	    t = `${abbrevTypes[t]}${brackets}`;
	    let data: Object = {classname: classname, typename: t, typename_orig: t_o};
	    methods.push(tmpl(data));
	}
	return methods.join('\n');
    }

    buildGlobalFnFromFunction(decl: string): string {
	/*
	  e.g. export function globalExample() {
	              console.log("this is a global function");
	      }
	*/
	let m: any = decl.match(/function +([\S]+)\(([^\)]*)\)/);
	if (!m) {
	    console.error(`Error: function name is not found in "${decl}"`);
	    return null;
	}
	let fnname: string = m[1]; // function name
	let params: string = m[2]; // can be null
	let pnames: string = '';
	
	if (0 < params.length) {
	    let pn: string[] = params.match(/([\S]+)(?=:)/g);
	    pnames = pn.join(', ');
	}
	let tmpl: any = Handlebars.compile(GLOBAL_FN_TEMPLATE);
	let data: Object = {fnname: fnname, params: params, pnames: pnames};
	return tmpl(data);
    }
    
    buildGlobalFnDecl(fns: string[]): string {
	let tmpl: any = Handlebars.compile(GLOBAL_TEMPLATE);
	let fns_str: string = fns.join('\n');
	let data: Object = {fns: fns_str};
	return tmpl(data);
    }

    buildImports(import_names: string[]): string {
	let fn_tmpl: any = Handlebars.compile(IMPORT_FN_TEMPLATE);
	let tmpl: any = Handlebars.compile(IMPORT_TEMPLATE);
	let fns: string[] = [];
	
	for (let fn of import_names) {
	    let imp: any = fn_tmpl({fnname: fn});
	    fns.push(imp);
	}
	let imp_str: string = fns.join(',\n    ');
	let data: Object = {imports: imp_str};
	return tmpl(data);
    }

};

