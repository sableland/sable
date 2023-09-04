import { CustomEvent, Event, EventTarget } from "ext:bueno/web/events.js";

globalThis.navigator = {};
globalThis.Event = Event;
globalThis.CustomEvent = CustomEvent;
globalThis.EventTarget = EventTarget;
