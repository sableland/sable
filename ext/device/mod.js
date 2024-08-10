import { op_device_mouse } from "ext:core/ops";

// TODO(lino-levan): Make this spec-compliant.
class MouseEvent extends Event {
  constructor(type, options) {
    super(type, options);
    this.screenX = options.screenX ?? 0;
    this.screenY = options.screenY ?? 0;
    this.clientX = options.clientX ?? 0;
    this.clientY = options.clientY ?? 0;
    this.ctrlKey = options.ctrlKey ?? false;
    this.shiftKey = options.shiftKey ?? false;
    this.altKey = options.altKey ?? false;
    this.metaKey = options.metaKey ?? false;
    this.button = options.button ?? 0;
    this.buttons = options.buttons ?? 0;
  }
}
globalThis.MouseEvent = MouseEvent;
globalThis.onmousemove = null;
globalThis.onmousedown = null;
globalThis.onmouseup = null;

let mouseX = 0;
let mouseY = 0;
let button1 = false;
let button2 = false;
let button3 = false;

let initialized = false;

const originalAddEventListener = globalThis.addEventListener;

globalThis.addEventListener = (...args) => {
  if(!initialized) {
    initialized = true;
    setInterval(() => {
      let buffer = new Uint32Array(5); // [mouseX, mouseY, button1, button2, button3]
      op_device_mouse(buffer);
      const [newX, newY] = buffer;
      const newButton1 = !!buffer[2];
      const newButton2 = !!buffer[3];
      const newButton3 = !!buffer[4];
      const buttons = buffer[2] | (buffer[3] << 1) | (buffer[4] << 2);

      const eventInit = {
        screenX: mouseX,
        screenY: mouseY,
        clientX: mouseX,
        clientY: mouseY,
        buttons
      };

      // handle mouse move
      if (newX !== mouseX || newY !== mouseY) {
        mouseX = newX;
        mouseY = newY;
        globalThis.dispatchEvent(new MouseEvent("mousemove", eventInit));
        globalThis.onmousemove?.(new MouseEvent("mousemove", eventInit));
      }

      // handle mouse buttons
      function maybeDispatchMouseEvent(mouse, before, after) {
        if(before !== after) {
          if(after) {
            globalThis.dispatchEvent(new MouseEvent("mousedown", eventInit));
            globalThis.onmousedown?.(new MouseEvent("mousedown", eventInit));
          } else {
            globalThis.dispatchEvent(new MouseEvent("mouseup", eventInit));
            globalThis.onmouseup?.(new MouseEvent("mouseup", eventInit));
          }
        }
      }

      maybeDispatchMouseEvent(1, button1, newButton1);
      maybeDispatchMouseEvent(2, button2, newButton2);
      maybeDispatchMouseEvent(3, button3, newButton3);

      button1 = newButton1;
      button2 = newButton2;
      button3 = newButton3;
    }, 1000/60);
  }

  originalAddEventListener(...args);
}
