// TODO(Im-Beast): Cleanup this code, it's a quick and dirty implementation
// FIXME(Im-Beast): Currently this implementation doesn't care about characters of variable widths

const tableCharacters = {
  bottomLeft: "\u2514",
  bottomRight: "\u2518",
  horizontal: "\u2500",
  leftHorizontal: "\u251C",
  rightHorizontal: "\u2524",
  bottomVertical: "\u2534",
  topVertical: "\u252C",
  topLeft: "\u250C",
  topRight: "\u2510",
  vertical: "\u2502",
  cross: "\u253C",
};

export function createTable(data, columns, groupStackSize, printerConfig) {
  const header = ["(index)"];

  if (typeof data[0] !== "object") {
    data = data.map((x) => [x]);
  }

  const rows = [];
  const maxWidthByColumns = [7];

  let row = 0;
  for (const [key, obj] of Object.entries(data)) {
    rows[row] ??= [];
    rows[row][0] = key;

    let column = 1;
    for (const [key, value] of Object.entries(obj)) {
      header[column] = key;

      rows[row] ??= [];
      rows[row][column] = value;

      maxWidthByColumns[column] = Math.max(
        value.length,
        maxWidthByColumns[column] ?? 0,
      );

      ++column;
    }

    ++row;
  }

  {
    let column = 0;
    for (const value of header) {
      if (column > 0 && columns && !columns?.includes(value)) {
        maxWidthByColumns.splice(column, 1);
        header.splice(column, 1);

        for (const row of rows) {
          row.splice(column, 1);
        }
      }

      ++column;
    }

    column = 0;
    for (const value of header) {
      maxWidthByColumns[column] = Math.max(
        value.length,
        maxWidthByColumns[column] ?? 0,
      );
      ++column;
    }
  }

  let string = "\n" +
    " ".repeat(groupStackSize * printerConfig.indent) +
    tableCharacters.topLeft;
  for (const [i, width] of maxWidthByColumns.entries()) {
    string += tableCharacters.horizontal.repeat(width + 2);

    if (i + 1 < maxWidthByColumns.length) {
      string += tableCharacters.topVertical;
    }
  }
  string += tableCharacters.topRight + "\n";

  for (const [column, value] of header.entries()) {
    if (column === 0) {
      string += " ".repeat(groupStackSize * printerConfig.indent) +
        tableCharacters.vertical +
        " ";
    }

    string += value + " ".repeat(maxWidthByColumns[column] - value.length);

    string += " " + tableCharacters.vertical;
    if (column + 1 < header.length) string += " ";
  }

  string += "\n" +
    " ".repeat(groupStackSize * printerConfig.indent) +
    tableCharacters.leftHorizontal;
  for (const [i, width] of maxWidthByColumns.entries()) {
    string += tableCharacters.horizontal.repeat(width + 2);

    if (i + 1 < maxWidthByColumns.length) {
      string += tableCharacters.cross;
    }
  }
  string += tableCharacters.rightHorizontal + "\n";

  for (const row of rows) {
    for (const [column, value] of row.entries()) {
      if (column === 0) {
        string += " ".repeat(groupStackSize * printerConfig.indent) +
          `${tableCharacters.vertical} `;
      }

      string += value + " ".repeat(maxWidthByColumns[column] - value.length);

      string += " " + tableCharacters.vertical;
      if (column + 1 < row.length) string += " ";
    }
    string += "\n";
  }

  string += " ".repeat(groupStackSize * printerConfig.indent) +
    tableCharacters.bottomLeft;
  for (const [i, width] of maxWidthByColumns.entries()) {
    string += tableCharacters.horizontal.repeat(width + 2);

    if (i + 1 < maxWidthByColumns.length) {
      string += tableCharacters.bottomVertical;
    }
  }
  string += tableCharacters.bottomRight;

  return string;
}
