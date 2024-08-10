import { TextDecoder, TextEncoder } from "ext:sable/web/encoding.js";
import { CustomEvent, Event, EventTarget } from "ext:sable/web/events.js";

globalThis.navigator = {};
globalThis.Event = Event;
globalThis.CustomEvent = CustomEvent;
globalThis.EventTarget = EventTarget;

globalThis.TextDecoder = TextDecoder;
globalThis.TextEncoder = TextEncoder;

// TODO(lino-levan): Make globalThis extend EventTarget
const globalEventTarget = new EventTarget();
globalThis.addEventListener = globalEventTarget.addEventListener.bind(globalEventTarget);
globalThis.removeEventListener = globalEventTarget.removeEventListener.bind(globalEventTarget);
globalThis.dispatchEvent = globalEventTarget.dispatchEvent.bind(globalEventTarget);
