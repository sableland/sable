const { test } = Sable.testing;

// a
// b
// c
// 1
// 2
await test("Timers API", (ctx) => {
	return new Promise((resolve) => {
		const start = performance.now();
		const id = setInterval(() => {
			console.log("1");
			ctx.order("order", 3);
			ctx.almostEquals(10, performance.now() - start, 3);
		}, 10);

		setTimeout(() => {
			console.log("2");
			ctx.order("order", 4);
			ctx.almostEquals(10, performance.now() - start, 3);
		}, 10);

		setTimeout(() => {
			clearInterval(id);
		}, 11);

		queueMicrotask(() => {
			console.log("a");
			ctx.order("order", 0);
			ctx.almostEquals(0, performance.now() - start, 1);
		});

		setTimeout(() => {
			console.log("c");
			ctx.order("order", 2);
			ctx.almostEquals(0, performance.now() - start, 2);
		}, 0);
		queueMicrotask(() => {
			console.log("b");
			ctx.order("order", 1);
			ctx.almostEquals(0, performance.now() - start, 1);
		});

		let now = performance.now();
		setTimeout(() => {
			console.time("one");
			ctx.order("order", 5);
			ctx.almostEquals(10, performance.now() - now, 3);

			now = performance.now();
			setTimeout(() => {
				console.time("two");
				ctx.order("order", 6);
				ctx.almostEquals(1, performance.now() - now, 2);

				now = performance.now();
				setTimeout(() => {
					console.time("three");
					ctx.order("order", 7);
					ctx.almostEquals(1, performance.now() - now, 2);

					now = performance.now();
					setTimeout(() => {
						console.time("four");
						ctx.order("order", 8);
						ctx.almostEquals(1, performance.now() - now, 2);

						now = performance.now();
						setTimeout(() => {
							console.time("five");
							ctx.order("order", 9);
							ctx.almostEquals(1, performance.now() - now, 2);

							now = performance.now();
							setTimeout(() => {
								console.log("It should start coarsening to 4ms now");
								console.time("six");
								ctx.order("order", 10);
								ctx.almostEquals(4, performance.now() - now, 2);

								now = performance.now();
								setTimeout(() => {
									console.time("seven");
									ctx.order("order", 11);
									ctx.almostEquals(4, performance.now() - now, 2);

									now = performance.now();
									setTimeout(() => {
										console.time("eight");
										ctx.order("order", 12);
										ctx.almostEquals(4, performance.now() - now, 2);

										now = performance.now();
										setTimeout(() => {
											console.timeEnd("eight");
											ctx.order("order", 13);
											ctx.almostEquals(4, performance.now() - now, 2);
											resolve();
										}, 1);
										console.timeEnd("seven");
									}, 1);
									console.timeEnd("six");
								}, 1);
								console.timeEnd("five");
							}, 1);
							console.timeEnd("four");
						}, 1);
						console.timeEnd("three");
					}, 1);
					console.timeEnd("two");
				}, 1);
				console.timeEnd("one");
			}, 1);
		}, 10);
	});
});
