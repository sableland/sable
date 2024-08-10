import { op_device_mouse } from "ext:core/ops";

// TODO(lino-levan): Make this spec-compliant.
class MouseEvent extends Event {
  constructor(type, options) {
    super(type, options);
    this.screenX = options.screenX;
    this.screenY = options.screenY;
    this.clientX = options.clientX;
    this.clientY = options.clientY;
  }
}
globalThis.MouseEvent = MouseEvent;

let mouseX = 0;
let mouseY = 0;

let initialized = false;

const originalAddEventListener = globalThis.addEventListener;

globalThis.addEventListener = (...args) => {
  if(!initialized) {
    initialized = true;
    setInterval(() => {
      let buffer = new Uint32Array(2);
      op_device_mouse(buffer);
      const [newX, newY] = buffer;

      if (newX !== mouseX || newY !== mouseY) {
        mouseX = newX;
        mouseY = newY;
        globalThis.dispatchEvent(new MouseEvent("mousemove", {
          screenX: mouseX,
          screenY: mouseY,
          clientX: mouseX,
          clientY: mouseY,
        }));
      }
    }, 1000/60);
  }

  originalAddEventListener(...args);
}
