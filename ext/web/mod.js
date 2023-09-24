import { CustomEvent, Event, EventTarget } from "ext:bueno/web/events.js";
import {
	ByteLengthQueuingStrategy,
	CountQueuingStrategy,
} from "ext:bueno/web/streams.js";

globalThis.navigator = {};

// Event API
globalThis.Event = Event;
globalThis.CustomEvent = CustomEvent;
globalThis.EventTarget = EventTarget;

// Streams API
globalThis.ByteLengthQueuingStrategy = ByteLengthQueuingStrategy;
globalThis.CountQueuingStrategy = CountQueuingStrategy;
