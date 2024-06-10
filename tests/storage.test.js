const { test } = Sable.testing;

await test("Storage", (t) => {
	for (
		const [name, storage] of [["LocalStorage", localStorage], [
			"SessionStorage",
			sessionStorage,
		]]
	) {
		t.test(name, (t) => {
			storage.clear();

			storage.setItem("dog", "woofer");
			t.equals(storage.getItem("dog"), "woofer");
			t.equals(storage.dog, "woofer");

			delete storage.dog;
			t.equals(storage.dog, undefined);
			t.equals(storage.getItem("dog"), null);

			storage.dog = "woofer";
			t.equals(storage.getItem("dog"), "woofer");
			t.equals(storage.dog, "woofer");

			storage.removeItem("dog");
			t.equals(storage.dog, undefined);
			t.equals(storage.getItem("dog"), null);

			storage.a = "1";
			storage.b = "2";
			storage.c = "3";
			storage.d = "4";
			t.deepEquals(Object.keys(storage), ["a", "b", "c", "d"]);
			t.equals(storage.length, 4);

			storage.clear();
			t.equals(storage.length, 0);
		});
	}
});
