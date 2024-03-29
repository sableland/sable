// This declaration file is used to give type hints in ext:core/ops specifiers
// Whenever new op is added, it should be added here as well

declare module "ext:core/ops" {
  // deno_core
  export function op_print(string: string, stderr?: boolean): void;
  export function op_get_promise_details(
    promise: Promise<any>,
  ): [state: 0 | 1 | 2, result: any];
  export function op_read(rid: number): Promise<Uint8Array | null>;
  export function op_write(rid: number, data: Uint8Array): Promise<void>;
  export function op_close(rid: number): Promise<void>;
  export function op_encode(input: string): Uint8Array;

  // sable
  export function op_runtime_state(): "default" | "test" | "bench";

  // battery
  export function op_battery_charging(): boolean;
  export function op_battery_charging_time(): number;
  export function op_battery_discharging_time(): number;
  export function op_battery_level(): number;

  // fs
  export function op_read_text_file(path: string): Promise<string>;
  export function op_write_text_file(path: string, data: string): Promise<void>;
  export function op_read_file(path: string): Promise<Uint8Array>;
  export function op_write_file(path: string, data: Uint8Array): Promise<void>;
  export function op_remove_file(path: string): Promise<void>;
  export function op_remove_dir(
    path: string,
    recursive: boolean,
  ): Promise<void>;

  // performance
  export function op_high_res_time(): number;
  export function op_time_origin(): number;

  // testing
  export function op_test_async_ops_sanitization(): boolean;
  export function op_diff_str(a: string, b: string): string;
  export function op_bench_fn(callback: () => void): number;

  // web
  type BufferSource = import("ext:sable/web/encoding.js").BufferSource;
  export function op_encoding_normalize_label(label: string): string;
  export function op_encoding_decode_utf8(
    input: BufferSource,
    ignoreBOM: boolean,
  ): void;
  export function op_encoding_decode_single(
    input: BufferSource,
    encoding: string,
    fatal: boolean,
    ignoreBOM: boolean,
  ): void;
  export function op_encode(): void;

  // timers
  export function op_timers_sleep(): Promise<number | null>;
  export function op_create_timer(delay: number, timerId: number): number;
}
