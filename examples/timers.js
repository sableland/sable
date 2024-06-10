// a
// b
// c
// 1
// 2

let int = setInterval(() => {
	console.log("1");
}, 10);

setTimeout(() => {
	console.log("2");
}, 10);

setTimeout(() => {
	clearInterval(int);
}, 11);

queueMicrotask(() => console.log("a"));
setTimeout(() => console.log("c"), 0);
queueMicrotask(() => console.log("b"));

setTimeout(() => {
	console.time("one");
	setTimeout(() => {
		console.time("two");
		setTimeout(() => {
			console.time("three");
			setTimeout(() => {
				console.time("four");
				setTimeout(() => {
					console.time("five");
					setTimeout(() => {
						console.log("It should start coarsening to 4ms now");

						console.time("six");
						setTimeout(() => {
							console.time("seven");
							setTimeout(() => {
								console.time("eight");
								setTimeout(() => {
									console.timeEnd("eight");
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
