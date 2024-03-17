import isOdd from "https://esm.sh/v135/is-odd@3.0.1/es2022/is-odd.mjs";

console.log(isOdd)

let a = 5;

console.log("Hello sable", a);

class ThisIsClass {
	myClassProp = "dog";
	dogName = "egg";
}

class Extended extends ThisIsClass {}

const classInstance = new ThisIsClass();
const class2Instance = new Extended();

function* generator() {
}

console.log(ThisIsClass, classInstance);

const set = new Set([
	1,
	2,
	3,
	{ test: 123 },
	4,
	{ gasjfhasfasjkfkajsf: 123123 },
	5,
	6,
	7,
	8,
	9,
	10,
	11,
	12,
]);
const shortArr = [1, 2, 3, 4];
const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const arrWShit = [
	{ uno: "dos", tres: "quatro" },
	2,
	3,
	[1, 2, 3],
	"hi",
	10,
];

const map = new Map([
	["k", "v"],
	["hdk", "v3"],
	["k", 3],
	["kdhf", {}],
	["kj", "v"],
]);

map.set("circ", map);

const longmap = new Map([
	["k", "v"],
	["hdk", "v3"],
	["hahgsfdk", "v3"],
	["hdk4k4", "v3hh"],
	["2k", 53n],
	["kdhf", {}],
	["gggkj", "v"],
]);

const wmap = new WeakMap([
	[[12, 3, 4], "hi"],
	[[12, 3, 4], { hello: "123" }],
	[[12, 4], "hfgfi"],
]);

const typedArr = new Uint8Array([
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	234,
	23463,
	7412,
	2,
	12,
	11,
]);

console.log("deep obj:", {
	hello: {
		world: "how are you?",
		im: {
			going: {
				even: "deeper",
			},
			fn() {
			},
			num: 5,
		},
	},
	class: ThisIsClass,
	classInst: classInstance,
	class2Instance,
	bigI: 10n,
	generator,
	Extended,
	biggerI: 1124582358092850923859023859023859082309539058209358902350n,
	symbol: Symbol("AWOOGA"),
	num: 2,
	map,
	longmap,
	wmap,
	set,
	shortArr,
	arr,
	["\n\n\n\x1b[32mLOLOL\x1b[0m"]: 123,
	arrWShit,
	str: "HELLO",
	bool: false,
	booltrue: true,
	typedArr,
	promise: new Promise((x) => {}),
	resolvedPromise: new Promise((res) => {
		res("RESOLVED!");
	}),
	rejectedPromise: new Promise((_, rej) => {
		rej("REJECTED!");
	}).catch(() => "rejected"),
	proxy: new Proxy({ hello: 123 }, {}),
});

console.log("pretty object: %o", {
	hello: "world",
});

const circular = {};

circular.ref = circular;
circular.ref2 = circular;
circular.ref3 = circular;

console.log(circular);

const arreruja = [];
arreruja[0] = arreruja;
arreruja[1] = arreruja;
arreruja[2] = arreruja;
arreruja[3] = arreruja;
arreruja[4] = arreruja;
console.log(arreruja);

const map2 = new Map();
map2.set("x", map2);
console.time("console apis");
console.log(undefined);
console.log(null);

console.error("Hello sable");

console.error("is a even?", isOdd(a));
console.trace("test %o", { hello: "world" });
console.assert(false, "dog");

console.timeLog("console apis", { test: "obj" });

for (let i = 0; i < 3; ++i) {
	console.count();
	console.count("dog");
}

console.countReset("dog");

for (let i = 0; i < 3; ++i) {
	console.count();
	console.count("dog");
}

console.countReset("cat");
console.timeEnd("console apis");

console.time("console apis");
console.timeEnd("console apis");

console.log("This is the outer level");
console.group();
console.log("Level 2");
console.groupCollapsed();
console.log("Level 3");
console.warn("More of level 3");
console.groupEnd();
console.log("Back to level 2");
console.groupEnd();
console.log("Back to the outer level");

function Person(firstName, lastName) {
	this.firstName = firstName;
	this.lastName = lastName;
}

const tyrone = new Person("Tyroneａｓｆａｓｆ", "Jones");
const janet = new Person("Janet", "Smith");
const maria = new Person("Maria", "Cruz");

console.table([tyrone, janet, maria]);

console.group();
console.log("a");
console.group();
console.log("b");
console.group();
console.log("c");
console.table([
	["Tyrone", "Jones"],
	["Janetａｓｆａｓｆ", "Smith 🐶🐶"],
	["Mar🐩🐩ia", "Cruz"],
	[{
		obj: true,
		a: 1,
		b: 2,
	}, 123],
]);
console.groupEnd();
console.groupEnd();
console.groupEnd();

const obj = {
	thisRefs: undefined,
	thisDoesnt: [1, 2, 3],
	secondRef: undefined,
	thirdRef: undefined,
	noRefAgain: {
		obj: true,
		a: {
			123: 78,
		},
	},
	thisArrRefsItself: [1, 2, 3],
};

obj.thisRefs = obj;
obj.secondRef = obj;
obj.thirdRef = obj;

obj.thisArrRefsItself.push(obj, obj.thisArrRefsItself);
obj.thisArrRefsItself.push(obj.thisArrRefsItself);
obj.thisArrRefsItself.push(obj.thisArrRefsItself);
obj.thisArrRefsItself.push(obj.thisArrRefsItself);
obj.thisArrRefsItself.push(obj.thisArrRefsItself);

console.log(obj.thisArrRefsItself);
console.log(obj);

console.log(obj.noRefAgain);

console.log({
	get hi() {
		return "this is getter";
	},
	set hi(hi) {},
	set dog(dog) {
	},
});

console.log({
	a: {
		b: {
			c: {
				d: {
					e: {
						f: {
							g: {
								h: {
									i: 1,
								},
							},
						},
					},
				},
			},
		},
	},
});
const en = {
	a: true,
	get dog() {
		return "lol";
	},
	set dog(dog) {},

	get shortObj() {
		return {
			asda: {
				asgsagags: {
					fgjklsjglkdsag: {
						asfasfmjafa: true,
					},
				},
			},
		};
	},

	get longObj() {
		return {
			asda: {
				asgsagags: {
					fgjklsjghasjfaskfhjkasfkashfashfjkhsag: {
						asfasfmjaasfajfasjfklasjfklasjfklafa: true,
					},
				},
			},
		};
	},
};

console.log(en);

console.log("%cHello %cworld", "color: red", "color: blue; background-color: yellow"); 
console.log("%o%O%c")