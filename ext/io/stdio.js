class SharedStdio {
  write(data) {
    return write(this.rid, data);
  }

  read(buffer) {
    return read(this.rid, buffer);
  }

  close() {
    close(this.rid);
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
