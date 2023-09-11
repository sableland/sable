import { textWidth } from "ext:bueno/utils/strings.js";

const tableCharacters = {
  topLeft: "\u250C",
  topRight: "\u2510",
  topVertical: "\u252C",

  horizontal: "\u2500",
  leftHorizontal: "\u251C",
  rightHorizontal: "\u2524",

  bottomLeft: "\u2514",
  bottomRight: "\u2518",
  bottomVertical: "\u2534",

  vertical: "\u2502",
  cross: "\u253C",
};

/**
 * @param {any[] | object} data Data to create table from
 * @param {(string | number)[]} columns An array which contains indexes of column to include in the table
 * @param {import("./printer.js").Printer} printer Printer used for formatting cell values
 * @returns
 */
export function createTable(data, columns, printer) {
  if (typeof data[0] !== "object") {
    data = data.map((x) => [x]);
  }

  const maxWidth = [7];
  const tableData = [
    ["(index)"],
  ];

  let string = "";

  let row = 1;
  for (const key in data) {
    const obj = data[key];

    let column = 1;
    for (const key in obj) {
      if (columns && !columns.includes(key)) continue;
      const value = printer.genericFormat(obj[key]).replaceAll("\n", "");

      tableData[0][column] = key;

      tableData[row] ??= [];
      tableData[row][0] ??= String(row);
      tableData[row][column] = value;

      maxWidth[column] = Math.max(
        textWidth(value),
        maxWidth[column] ?? textWidth(key),
      );

      ++column;
    }

    ++row;
  }

  let topBar = tableCharacters.topLeft;
  let headerSeparator = tableCharacters.leftHorizontal;
  let bottomBar = tableCharacters.bottomLeft;

  for (let i = 0; i < maxWidth.length; ++i) {
    const width = maxWidth[i];
    const horiz = tableCharacters.horizontal.repeat(width + 2);

    topBar += horiz;
    headerSeparator += horiz;
    bottomBar += horiz;

    if (i < maxWidth.length - 1) {
      topBar += tableCharacters.topVertical;
      headerSeparator += tableCharacters.cross;
      bottomBar += tableCharacters.bottomVertical;
    }
  }

  topBar += tableCharacters.topRight;
  headerSeparator += tableCharacters.rightHorizontal;
  bottomBar += tableCharacters.bottomRight;

  console.log(topBar);
  for (const [row, rowData] of tableData.entries()) {
    let string = "";
    for (const [column, value] of rowData.entries()) {
      string += tableCharacters.vertical + " " + value + " ".repeat(
        maxWidth[column] - textWidth(value) + 1,
      );
    }
    string += tableCharacters.vertical;

    console.log(string);

    if (row === 0) {
      console.log(headerSeparator);
    }
  }
  console.log(bottomBar);

  return string;
}
