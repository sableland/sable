const { test } = Sable.testing;

test("Encoding API", (ctx) => {
	const decoder = new TextDecoder("utf-8");
	const encoder = new TextEncoder();
	const text = "Hello, world!";

	ctx.equals(text, decoder.decode(encoder.encode(text)));
});
