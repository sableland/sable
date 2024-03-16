class SharedStdio {
	rid;

	write(data) {
		return Sable.io.write(this.rid, data);
	}

	read(buffer) {
		return Sable.io.read(this.rid, buffer);
	}

	close() {
		Sable.io.close(this.rid);
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
