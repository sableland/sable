class SharedStdio {
	write(data) {
		return Bueno.io.write(this.rid, data);
	}

	read(buffer) {
		return Bueno.io.read(this.rid, buffer);
	}

	close() {
		Bueno.io.close(this.rid);
	}
}

export class Stdin extends SharedStdio {
	rid = 0;
}

export class Stdout extends SharedStdio {
	rid = 1;
}

export class Stderr extends SharedStdio {
	rid = 2;
}
