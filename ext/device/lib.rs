use deno_core::{op2, OpState};
use device_query::{DeviceQuery, DeviceState, Keycode, MouseState};

#[op2(fast)]
pub fn op_device_mouse(#[buffer] buf: &mut [u32]) -> () {
    let device_state = DeviceState::new();
    let mouse: MouseState = device_state.get_mouse();
    buf[0] = mouse.coords.0 as u32;
    buf[1] = mouse.coords.1 as u32;
}
