addEventListener("mousemove", (e) => {
  console.log(e.clientX, e.clientY);
});

addEventListener("mousedown", (e) => {
  console.log("down");
});

addEventListener("mouseup", (e) => {
  console.log("up");
});
