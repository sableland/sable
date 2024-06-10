// https://html.spec.whatwg.org/multipage/webstorage.html

import {
	op_webstorage_clear,
	op_webstorage_get_item,
	op_webstorage_key,
	op_webstorage_keys,
	op_webstorage_length,
	op_webstorage_remove_item,
	op_webstorage_set_item,
} from "ext:core/ops";

import {
	brandedCheck,
	createBranded,
	illegalConstructor,
	requiredArgumentsCheck,
	toDOMString,
	toInt,
} from "ext:sable/webidl/mod.ts";

type StorageType = "local" | "session";

const _type = Symbol("[[type]]");

class Storage {
	[_type]: StorageType;

	constructor() {
		illegalConstructor();
	}

	get length(): number {
		brandedCheck(this, Storage);
		return op_webstorage_length(this[_type] === "session");
	}

	key(index: number): string | null {
		const errorMessage = "Failed to execute Storage.key:";
		brandedCheck(this, Storage, errorMessage);
		requiredArgumentsCheck(arguments.length, 1, errorMessage);

		index = toInt(index, 64, false);
		return op_webstorage_key(index, this[_type] === "session");
	}

	getItem(key: string): string | null {
		const errorMessage = "Failed to execute Storage.getItem:";
		brandedCheck(this, Storage, errorMessage);
		requiredArgumentsCheck(arguments.length, 1, errorMessage);

		key = toDOMString(key);
		return op_webstorage_get_item(key, this[_type] === "session");
	}

	setItem(key: string, value: string): void {
		const errorMessage = "Failed to execute Storage.setItem:";
		brandedCheck(this, Storage, errorMessage);
		requiredArgumentsCheck(arguments.length, 2, errorMessage);

		key = toDOMString(key);
		value = toDOMString(value);
		op_webstorage_set_item(key, value, this[_type] === "session");
	}

	removeItem(key: string): void {
		const errorMessage = "Failed to execute Storage.removeItem:";
		brandedCheck(this, Storage, errorMessage);
		requiredArgumentsCheck(arguments.length, 1, errorMessage);

		key = toDOMString(key);
		op_webstorage_remove_item(key, this[_type] === "session");
	}

	clear(): void {
		brandedCheck(this, Storage, "Failed to execute Storage.clear:");
		op_webstorage_clear(this[_type] === "session");
	}
}

function buildStorage(type: StorageType): Storage {
	const storage = createBranded(Storage);
	storage[_type] = "local";

	// We need proxy for accesing items via property accesors
	// and also for deleting items using `delete` keyword
	//
	// Properties which are symbols are handled just like
	// in normal objects
	const proxiedStorage = new Proxy(storage, {
		get(target, property, receiver) {
			if (typeof property === "symbol" || Reflect.has(target, property)) {
				return Reflect.get(target, property, receiver);
			}
			return target.getItem(property) ?? undefined;
		},
		set(target, property, value, receiver) {
			if (typeof property === "symbol") {
				return Reflect.set(target, property, value, receiver);
			}
			// In case it fails it throws an error
			target.setItem(property, value);
			return true;
		},
		has(target, property) {
			if (typeof property === "symbol") {
				return Reflect.has(target, property);
			}
			return !!target.getItem(property);
		},
		deleteProperty(target, property) {
			if (typeof property === "symbol") {
				return Reflect.deleteProperty(target, property);
			}
			target.removeItem(property);
			return true;
		},
		getOwnPropertyDescriptor(target, property) {
			const descriptor = Reflect.getOwnPropertyDescriptor(target, property);
			if (descriptor) return descriptor;
			else if (typeof property === "symbol") return undefined;

			return {
				value: target.getItem(property),
				writable: true,
				enumerable: true,
				configurable: true,
			};
		},
		ownKeys(target) {
			return op_webstorage_keys(target[_type] === "session");
		},
	});

	return proxiedStorage;
}

globalThis.localStorage = buildStorage("local");
globalThis.sessionStorage = buildStorage("session");
