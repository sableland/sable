import { TextDecoder, TextEncoder } from "ext:bueno/web/encoding.js";
import { CustomEvent, Event, EventTarget } from "ext:bueno/web/events.js";

globalThis.navigator = {};
globalThis.Event = Event;
globalThis.CustomEvent = CustomEvent;
globalThis.EventTarget = EventTarget;

globalThis.TextDecoder = TextDecoder;
globalThis.TextEncoder = TextEncoder;
